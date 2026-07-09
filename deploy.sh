#!/bin/bash
echo "🔨 构建中..."
npm run build
if [ $? -eq 0 ]; then
  echo "🚀 部署到 GitHub Pages..."
  npx gh-pages -d dist -m "Update [ci skip]"
  echo "✅ 完成！https://wzeze-lll.github.io/evidenceflow-ai/"
  echo "⏳ GitHub Pages 需要约 1 分钟生效"
else
  echo "❌ 构建失败，请检查错误"
fi
