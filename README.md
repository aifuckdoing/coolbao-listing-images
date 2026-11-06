# COOLBAO listing images

Walmart-ready 2200x2200 product images, one folder per SKU (`walmart/<SKU>/`, sorted by file name, 01 = main image, max 9).

## 以后上新品怎么传图到领星 Walmart 草稿

1. 把新产品图片处理成 2200x2200 白底 JPG（每张 < 5MB），命名 `<SKU>_01_Main_White.jpg` … `<SKU>_09_xxx.jpg`。
2. 放进本仓库 `walmart/<SKU>/` 并推送到 GitHub（或让 Claude 来推）。
3. 在 Chrome 打开领星该商品的「编辑Walmart商品」草稿页，执行 `tools/lingxing-walmart-upload.js` 的内容，然后：
   - 单体：`await LXW.single('<SKU>')` —— 自动传 9 张并「存为草稿」。
   - 变体：`await LXW.variants({'<子体MSKU>':'<图片文件夹SKU>', ...})`，再 `await LXW.save()`。
4. 中途网络失败直接重跑同一行，已传的会跳过。

为什么这么做：Claude in Chrome 的文件上传工具在这个环境里无法审批，所以改为页面内从 GitHub 拉图后直接塞进上传控件，领星照常上传到自己的图床。
