#!/usr/bin/env node

/**
 * Generate Preview
 * 原稿（Markdown or JSON）+ 画像 → preview/ のHTMLに反映
 *
 * 使い方:
 *   node generate-preview.js                    # input/ フォルダの内容を反映
 *   node generate-preview.js --gdoc=DOC_ID      # Google Docsから取得して反映
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { processImages, printSummary } from './image-processor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT_DIR = path.join(__dirname, 'input');
const PREVIEW_DIR = path.join(ROOT, 'preview');
const IMAGES_INPUT = path.join(__dirname, 'images-input');
const IMAGES_OUTPUT = path.join(ROOT, 'assets/images');

async function main() {
  console.log('\n🏥 Clinic Preview Generator\n');

  // ── 1. クリニック情報を読み込み ──
  let clinicData = {};
  const clinicJsonPath = path.join(INPUT_DIR, 'clinic.json');
  try {
    clinicData = JSON.parse(await fs.readFile(clinicJsonPath, 'utf-8'));
    console.log(`✓ クリニック情報: ${clinicData.name || '(名称未設定)'}`);
  } catch {
    console.log('⚠ input/clinic.json が見つかりません — デフォルト値を使用');
    clinicData = getDefaultClinic();
  }

  // ── 2. 各ページの原稿を読み込み ──
  const pages = ['about', 'treatment', 'staff', 'access', 'price'];
  const pageData = {};

  for (const page of pages) {
    // Markdown優先、なければJSON
    const mdPath = path.join(INPUT_DIR, `${page}.md`);
    const jsonPath = path.join(INPUT_DIR, `${page}.json`);

    try {
      const content = await fs.readFile(mdPath, 'utf-8');
      pageData[page] = parsePageMarkdown(content);
      console.log(`✓ ${page}: Markdownから読み込み`);
    } catch {
      try {
        pageData[page] = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
        console.log(`✓ ${page}: JSONから読み込み`);
      } catch {
        console.log(`  ${page}: 原稿なし — テンプレートのまま`);
      }
    }
  }

  // ── 3. 画像処理 ──
  try {
    const files = await fs.readdir(IMAGES_INPUT);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|tiff)$/i.test(f));
    if (imageFiles.length > 0) {
      console.log(`\n📷 画像処理中... (${imageFiles.length}枚)`);
      const config = JSON.parse(await fs.readFile(path.join(__dirname, 'config.json'), 'utf-8'));
      const results = await processImages(IMAGES_INPUT, IMAGES_OUTPUT, config.images);
      printSummary(results);
    }
  } catch {
    // images-input が空でもエラーにしない
  }

  // ── 4. プレビューHTMLを生成 ──
  console.log('\n📝 プレビュー生成中...');

  for (const page of pages) {
    const htmlPath = path.join(PREVIEW_DIR, `${page}.html`);
    try {
      let html = await fs.readFile(htmlPath, 'utf-8');
      html = replaceClinicInfo(html, clinicData);
      if (pageData[page]) {
        html = replacePageContent(html, pageData[page], page);
      }
      await fs.writeFile(htmlPath, html, 'utf-8');
      console.log(`  ✓ ${page}.html 更新`);
    } catch (err) {
      console.error(`  ✗ ${page}.html: ${err.message}`);
    }
  }

  // index.html もクリニック名を反映
  try {
    let indexHtml = await fs.readFile(path.join(PREVIEW_DIR, 'index.html'), 'utf-8');
    indexHtml = replaceClinicInfo(indexHtml, clinicData);
    await fs.writeFile(path.join(PREVIEW_DIR, 'index.html'), indexHtml, 'utf-8');
  } catch {}

  console.log('\n✅ 完了！ プレビューが更新されました\n');
}

// ── Markdownをパース ──
function parsePageMarkdown(text) {
  const result = { sections: [] };
  let currentSection = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('# ')) {
      currentSection = { title: line.slice(2).trim(), content: [] };
      result.sections.push(currentSection);
    } else if (line.startsWith('## ')) {
      if (currentSection) {
        currentSection.content.push({ type: 'heading', value: line.slice(3).trim() });
      }
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentSection) {
        currentSection.content.push({ type: 'list-item', value: line.replace(/^[-*]\s/, '').trim() });
      }
    } else if (line.match(/!\[.*\]\(.*\)/)) {
      const m = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (m && currentSection) {
        currentSection.content.push({ type: 'image', alt: m[1], src: m[2] });
      }
    } else if (line.trim()) {
      if (currentSection) {
        currentSection.content.push({ type: 'text', value: line.trim() });
      }
    }
  }
  return result;
}

// ── クリニック情報を置換 ──
function replaceClinicInfo(html, clinic) {
  const replacements = [
    ['さくら歯科クリニック', clinic.name || 'さくら歯科クリニック'],
    ['さくら歯科', clinic.name_short || clinic.name || 'さくら歯科'],
    ['03-1234-5678', clinic.tel || '03-1234-5678'],
    ['0312345678', (clinic.tel || '03-1234-5678').replace(/[^0-9+]/g, '')],
    ['〒150-0001', clinic.zip || '〒150-0001'],
    ['東京都渋谷区神宮前1-2-3 さくらビル2F', clinic.address || '東京都渋谷区神宮前1-2-3 さくらビル2F'],
    ['東京都渋谷区神宮前1-2-3', clinic.address_short || clinic.address || '東京都渋谷区神宮前1-2-3'],
    ['月〜金 9:00〜18:30', clinic.hours_weekday || '月〜金 9:00〜18:30'],
    ['月〜土 9:00〜18:30', clinic.hours_short || '月〜土 9:00〜18:30'],
    ['土 9:00〜17:00', clinic.hours_sat || '土 9:00〜17:00'],
    ['木曜・日曜・祝日', clinic.closed || '木曜・日曜・祝日'],
    ['あなたの笑顔を、もっと輝かせる', clinic.catchcopy || 'あなたの笑顔を、もっと輝かせる'],
    ['田中 太郎', clinic.director_name || '田中 太郎'],
    ['たなか たろう', clinic.director_name_kana || 'たなか たろう'],
  ];

  for (const [from, to] of replacements) {
    html = html.replaceAll(from, to);
  }
  return html;
}

// ── ページ固有コンテンツを置換 ──
function replacePageContent(html, data, page) {
  if (!data.sections || data.sections.length === 0) return html;

  for (const section of data.sections) {
    const title = section.title;
    const contentHtml = section.content
      .map(c => {
        if (c.type === 'text') return `<p>${esc(c.value)}</p>`;
        if (c.type === 'heading') return `<h3>${esc(c.value)}</h3>`;
        if (c.type === 'list-item') return `<li>${esc(c.value)}</li>`;
        if (c.type === 'image') return `<img src="${esc(c.src)}" alt="${esc(c.alt)}" loading="lazy">`;
        return '';
      })
      .join('\n');

    // プレースホルダーテキストの置換を試みる
    // 院長メッセージ系
    if (title.match(/メッセージ|挨拶|message/i)) {
      const texts = section.content.filter(c => c.type === 'text').map(c => c.value);
      if (texts.length > 0) {
        // 院長メッセージの見出し
        html = html.replace(
          /患者さまの「こうなりたい」に<br>寄り添う診療を。/,
          esc(texts[0])
        );
        // 本文
        if (texts.length > 1) {
          const bodyHtml = texts.slice(1).map(t => `<p>${esc(t)}</p>`).join('\n');
          html = html.replace(
            /<div class="about-message__text">[\s\S]*?<\/div>/,
            `<div class="about-message__text">\n${bodyHtml}\n</div>`
          );
        }
      }
    }

    // 理念系
    if (title.match(/理念|想い|コンセプト|philosophy/i)) {
      const texts = section.content.filter(c => c.type === 'text').map(c => c.value);
      if (texts.length > 0) {
        const bodyHtml = texts.map(t => `<p>${esc(t)}</p>`).join('\n');
        html = html.replace(
          /<div class="about-philosophy__body">[\s\S]*?<\/div>/,
          `<div class="about-philosophy__body">\n${bodyHtml}\n</div>`
        );
      }
    }
  }

  return html;
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getDefaultClinic() {
  return {
    name: 'さくら歯科クリニック',
    name_short: 'さくら歯科',
    tel: '03-1234-5678',
    zip: '〒150-0001',
    address: '東京都渋谷区神宮前1-2-3 さくらビル2F',
    hours_weekday: '月〜金 9:00〜18:30',
    hours_sat: '土 9:00〜17:00',
    closed: '木曜・日曜・祝日',
    catchcopy: 'あなたの笑顔を、もっと輝かせる',
    director_name: '田中 太郎',
  };
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
