// 领星 ERP · Walmart 刊登草稿 —— 自动上传产品图片
// 图片来源：本仓库 walmart/<SKU>/ 文件夹（按文件名排序，01 = 主图，最多 9 张）
//
// 用法（在领星的「编辑Walmart商品」草稿页面，F12 控制台或 Claude 执行）：
//   单体草稿：      await LXW.single('W6013P517415')            // 传完自动「存为草稿」
//   变体草稿子体图： await LXW.variants({'CB-W6013P538878':'W6013P538878', ...})  // MSKU -> 图片文件夹
//                    然后 await LXW.save()
//
// 已上传的张数会被跳过（中途失败可直接重跑续传）。

(function () {
  const REPO = 'aifuckdoing/coolbao-listing-images';
  const W = (ms) => new Promise((r) => setTimeout(r, ms));

  async function listImages(sku) {
    for (let a = 0; a < 4; a++) {
      try {
        const r = await fetch(`https://api.github.com/repos/${REPO}/contents/walmart/${sku}`);
        if (r.ok) return (await r.json()).map((f) => f.name).filter((n) => /\.jpe?g$/i.test(n)).sort();
      } catch (e) {}
      await W(2000);
    }
    throw new Error('无法读取图片列表 ' + sku);
  }

  async function getFile(sku, name) {
    const urls = [
      `https://raw.githubusercontent.com/${REPO}/main/walmart/${sku}/${name}`,
      `https://cdn.jsdelivr.net/gh/${REPO}@main/walmart/${sku}/${name}`,
    ];
    for (let a = 0; a < 6; a++) {
      try {
        const r = await fetch(urls[a % 2], { cache: 'no-store' });
        if (r.ok) return new File([await r.blob()], name, { type: 'image/jpeg' });
      } catch (e) {}
      await W(2000);
    }
    throw new Error('下载失败 ' + name);
  }

  // getInput(): 返回当前可用的 file input；count(): 当前已上传张数
  async function pump(sku, getInput, count) {
    const names = (await listImages(sku)).slice(0, 9);
    const log = [];
    for (const n of names.slice(count())) {
      const before = count();
      const dt = new DataTransfer();
      dt.items.add(await getFile(sku, n));
      const fi = getInput();
      fi.files = dt.files;
      fi.dispatchEvent(new Event('change', { bubbles: true }));
      let ok = false;
      for (let i = 0; i < 60; i++) { await W(500); if (count() > before) { ok = true; break; } }
      log.push(n.replace(sku + '_', '').slice(0, 2) + (ok ? '+' : 'x'));
      if (!ok) break;
    }
    return `${sku}: ${count()} 张 [${log.join(' ')}]`;
  }

  function mainImageBox() {
    let box = document.querySelector('input[type=file]');
    for (let i = 0; i < 7; i++) { box = box.parentElement; if (box.innerText.includes('至少1张')) break; }
    return box.parentElement;
  }

  async function save() {
    [...document.querySelectorAll('button')]
      .find((b) => b.offsetParent && b.innerText.replace(/\s/g, '') === '存为草稿').click();
    for (let i = 0; i < 30 && location.pathname.includes('edit'); i++) await W(300);
    return '已保存:' + !location.pathname.includes('edit');
  }

  async function single(sku) {
    const box = mainImageBox();
    const r = await pump(sku, () => document.querySelector('input[type=file]'), () => box.querySelectorAll('img').length);
    if (box.querySelectorAll('img').length < 9) return r + ' （未满 9 张，未保存，可重跑续传）';
    return r + ' ' + (await save());
  }

  // 变体：点每行「子体图片」的 + 打开「添加变体图片」弹窗，传图后点确定
  async function variants(map) {
    const out = [];
    const rows = () => [...document.querySelectorAll('tr')].filter((tr) => tr.querySelector('input[type=file]'));
    const dlg = () => [...document.querySelectorAll('.el-dialog')].find((d) => d.offsetParent && d.innerText.includes('添加变体图片'));
    for (const [msku, sku] of Object.entries(map)) {
      const row = rows().find((tr) => [...tr.querySelectorAll('input')].some((x) => x.value === msku));
      if (!row) { out.push(msku + ': 找不到该行'); continue; }
      const plus = row.children[1].querySelector('.el-icon-plus, i, div, span');
      (plus || row.children[1]).click();
      for (let i = 0; i < 20 && !dlg(); i++) await W(300);
      if (!dlg()) { out.push(msku + ': 弹窗未打开'); continue; }
      const r = await pump(sku, () => dlg().querySelector('input[type=file]'), () => dlg().querySelectorAll('img').length);
      [...dlg().querySelectorAll('button')].find((b) => b.innerText.trim() === '确定').click();
      await W(1000);
      out.push(msku + ' ← ' + r);
    }
    return out.join('\n');
  }

  window.LXW = { single, variants, save, listImages };
  return 'LXW ready';
})();
