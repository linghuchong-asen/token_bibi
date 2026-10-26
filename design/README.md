# token比比 · 快速验证设计稿

## 目录

- `svg/`：11 个低保真 SVG 线框稿，可直接导入 Figma / Sketch / Illustrator。
- `svg-hifi/`：11 个高保真 SVG 设计稿，可继续在矢量工具中编辑。
- `png/`：11 张高保真 PNG，尺寸 2880×1800，适合快速评审或放入文档。
- `prototypes/prototype.html`：桌面端 HTML 原型，包含 11 个页面、低保真 / 高保真切换和设计说明。

## 打开方式

```bash
cd /root/workspace/token_compare/token-bibi/design/prototypes
python3 -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080/prototype.html
```

也可以直接双击 `prototype.html`。

## 页面范围

1. 首页
2. 模型比价页
3. 模型详情页
4. 平台详情页
5. 订阅套餐页
6. 积分 / 充值页
7. 卡密 / 兑换码页
8. 成本计算器页
9. 分享结果页
10. 长尾 SEO 页面
11. 数据方法 / 商业边界页
