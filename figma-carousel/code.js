// 빅무브 카드뉴스 플러그인: CSV 한 장 = 슬라이드 한 장. 'BM Slide 1080x1350' 컴포넌트로 만든다.
// Figma 데스크톱 앱 > Plugins > Development > Import plugin from manifest 로 등록해서 쓴다.
figma.showUI(__html__, { width: 480, height: 800 });

var COMP_NAME = 'BM Slide 1080x1350';
var FONT = 'Noto Sans KR';
var GREEN = { r: 0x54 / 255, g: 0xA3 / 255, b: 0x29 / 255 };
var WHITE = { r: 1, g: 1, b: 1 };
var INK = { r: 0x3D / 255, g: 0x3D / 255, b: 0x3D / 255 };
var BG = { r: 0xFA / 255, g: 0xF8 / 255, b: 0xF3 / 255 };

// 하이라이트 커버 아이콘 (얇은 선, 흰색)
function svgIcon(body) {
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
}
var COVERS = [
  { key: 'steps', svg: svgIcon('<path d="M10 6h10M10 12h10M10 18h10"/><circle cx="5" cy="6" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="5" cy="18" r="1.2"/>') },   // 참여 절차
  { key: 'check', svg: svgIcon('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>') },   // 신청 전 확인
  { key: 'faq', svg: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8"/><path d="M12 17h.01"/>') },   // 자주 묻는 질문
  { key: 'kakao', svg: svgIcon('<path d="M12 4c-4.8 0-8.5 3-8.5 6.8 0 2.4 1.5 4.5 3.9 5.7L6.6 20l4-2.6c.5.1 1 .1 1.4.1 4.8 0 8.5-3 8.5-6.7S16.8 4 12 4Z"/>') }   // 카카오 상담
];

// 디자인 설정: Claude가 여기 숫자를 고친다. 플러그인을 실행할 때마다 'BM Slide' 틀에 적용된다.
var STYLE = {
  titleSize: 88,       // 보통 장 제목
  coverTitleSize: 120, // 표지(type=cover) 제목
  subSize: 46,         // 본문 (11/09 40 → 46)
  subLineHeight: 155   // 본문 줄 간격 %
};

function applyStyle(comp) {
  var t = comp.findOne(function (n) { return n.name === 'Title'; });
  var s = comp.findOne(function (n) { return n.name === 'Sub'; });
  if (t) t.fontSize = STYLE.titleSize;
  if (s) { s.fontSize = STYLE.subSize; s.lineHeight = { unit: 'PERCENT', value: STYLE.subLineHeight }; }
}

// 부민 스타일 (11/10): 원본 틀은 그대로 두고 복제한 틀에만 적용한다
// 모서리 43·57px (1080x1350 기준)
var BUMIN = {
  compName: 'BM Slide 1080x1350 (부민 스타일)',
  families: ['NanumSquare Neo', 'NanumSquare Neo OTF', 'NanumSquare Neo variable', 'NanumSquareNeo', 'NanumSquareNeoOTF'],
  bg: { r: 0xFF / 255, g: 0xF9 / 255, b: 0xF4 / 255 },
  ink: { r: 0x40 / 255, g: 0x40 / 255, b: 0x40 / 255 },
  letterSpacing: -2,   // %
  subLineHeight: 150,  // %
  titleLineHeight: 135,
  radiusL: 57, radiusM: 43,
  styleMap: { Black: 'Heavy', ExtraBold: 'Heavy', Bold: 'ExtraBold', SemiBold: 'Bold', Medium: 'Bold', Regular: 'Regular', Light: 'Light' }
};

function sameColor(a, b) {
  return Math.abs(a.r - b.r) < 0.01 && Math.abs(a.g - b.g) < 0.01 && Math.abs(a.b - b.b) < 0.01;
}

// 설치된 NanumSquare Neo 이름과 굵기 목록을 찾는다
async function findBuminFont() {
  var all = await figma.listAvailableFontsAsync();
  for (var i = 0; i < BUMIN.families.length; i++) {
    var fam = BUMIN.families[i];
    var styles = all.filter(function (f) { return f.fontName.family === fam; }).map(function (f) { return f.fontName.style; });
    if (styles.length) return { family: fam, styles: styles };
  }
  // 이름이 조금 달라도(가변 글꼴 등) NanumSquare Neo 계열이면 쓴다
  var fams = {};
  all.forEach(function (f) { if (/nanum ?square ?neo/i.test(f.fontName.family)) (fams[f.fontName.family] = fams[f.fontName.family] || []).push(f.fontName.style); });
  var fk = Object.keys(fams);
  if (fk.length) return { family: fk[0], styles: fams[fk[0]] };
  var near = all.filter(function (f) { return /nanum ?square/i.test(f.fontName.family); }).map(function (f) { return f.fontName.family; });
  throw new Error("'NanumSquare Neo' 글꼴을 찾지 못했어요. PC에 설치한 뒤 Figma를 다시 켜 주세요.\n(네이버 한글한글 아름답게 > 나눔스퀘어 네오)" + (near.length ? '\n비슷한 글꼴: ' + near.filter(function (v, k, a) { return a.indexOf(v) === k; }).join(', ') : ''));
}

function buminStyle(bf, style) {
  var key = style.replace(/\s/g, '');
  var want = bf.styles.indexOf(style) > -1 && /^(Light|Regular|Bold|ExtraBold|Heavy)$/.test(key) && !BUMIN.styleMap.hasOwnProperty(key) ? style : (BUMIN.styleMap[key] || 'Regular');
  var order = [want, 'ExtraBold', 'Bold', 'Regular'];
  for (var i = 0; i < order.length; i++) if (bf.styles.indexOf(order[i]) > -1) return order[i];
  return bf.styles[0];
}

// 원본 틀을 복제해 부민 스타일을 입힌다. 이미 있으면 그것을 다시 맞춘다
async function buminComp(base, bf) {
  await figma.loadAllPagesAsync();
  var found = figma.root.findAllWithCriteria({ types: ['COMPONENT'] }).filter(function (n) { return n.name === BUMIN.compName; });
  var comp = found[0];
  if (!comp) {
    comp = base.clone();
    comp.name = BUMIN.compName;
    comp.x = base.x; comp.y = base.y - base.height - 200;
  }
  await Promise.all(bf.styles.map(function (st) { return figma.loadFontAsync({ family: bf.family, style: st }); }));
  var nodes = [comp].concat(comp.findAll(function () { return true; }));
  var baseTexts = base.findAll(function (c) { return c.type === 'TEXT'; });
  var compTexts = comp.findAll(function (c) { return c.type === 'TEXT'; });
  for (var bt = 0; bt < baseTexts.length; bt++) {
    var bs = baseTexts[bt].getStyledTextSegments(['fontName']);
    for (var bk = 0; bk < bs.length; bk++) await figma.loadFontAsync(bs[bk].fontName);
  }
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if ('fills' in n && n.fills !== figma.mixed && n.fills.length) {
      n.fills = n.fills.map(function (f) {
        if (f.type !== 'SOLID') return f;
        if (sameColor(f.color, BG)) return Object.assign({}, f, { color: BUMIN.bg });
        if (sameColor(f.color, INK)) return Object.assign({}, f, { color: BUMIN.ink });
        return f;
      });
    }
    if (n.type === 'TEXT') {
      var segs = n.getStyledTextSegments(['fontName']);
      for (var k = 0; k < segs.length; k++) await figma.loadFontAsync(segs[k].fontName);
      var bn = baseTexts[compTexts.indexOf(n)];
      var src = bn && bn.characters === n.characters ? bn.getStyledTextSegments(['fontName']) : null;
      if (src) {
        src.forEach(function (sg) { n.setRangeFontName(sg.start, sg.end, { family: bf.family, style: buminStyle(bf, sg.fontName.style) }); });
      } else {
        var st0 = bn ? bn.getStyledTextSegments(['fontName'])[0].fontName.style : segs[0].fontName.style;
        n.fontName = { family: bf.family, style: buminStyle(bf, st0) };
      }
      n.letterSpacing = { unit: 'PERCENT', value: BUMIN.letterSpacing };
      if (n.name === 'Sub') n.lineHeight = { unit: 'PERCENT', value: BUMIN.subLineHeight };
      if (n.name === 'Title') n.lineHeight = { unit: 'PERCENT', value: BUMIN.titleLineHeight };
    } else if (n !== comp && 'cornerRadius' in n && n.cornerRadius !== figma.mixed && n.cornerRadius > 0) {
      var pill = n.cornerRadius >= Math.min(n.width, n.height) / 2 - 1;
      if (!pill) n.cornerRadius = Math.max(n.width, n.height) >= 600 ? BUMIN.radiusL : BUMIN.radiusM;
    }
  }
  return comp;
}

// 따옴표·줄바꿈이 들어간 칸까지 읽는 CSV 파서
function parseCSV(text) {
  var rows = [], row = [], cell = '', q = false, i, c;
  text = text.replace(/^\uFEFF/, '');
  var first = text.split(/\r?\n/)[0];
  var D = first.indexOf('\t') > -1 ? '\t' : ',';  // 엑셀에서 복사하면 탭으로 구분됨
  for (i = 0; i < text.length; i++) {
    c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { q = false; }
      } else { cell += c; }
    } else if (c === '"') { q = true; }
    else if (c === D) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.join('').trim() !== '') rows.push(row);
      row = [];
    } else { cell += c; }
  }
  row.push(cell);
  if (row.join('').trim() !== '') rows.push(row);
  return rows;
}

// [[강조]] 표시를 빼고, 강조할 위치를 돌려준다. 칸 안의 \n 은 줄바꿈으로 바꾼다.
function stripMarks(s) {
  s = (s || '').replace(/\\n/g, '\n');
  var out = '', ranges = [], i = 0;
  while (i < s.length) {
    if (s.substr(i, 2) === '[[') {
      var end = s.indexOf(']]', i + 2);
      if (end > -1) {
        var word = s.substring(i + 2, end);
        ranges.push([out.length, out.length + word.length]);
        out += word; i = end + 2; continue;
      }
    }
    out += s[i]; i++;
  }
  return { text: out, ranges: ranges };
}

// 일반 플러그인 API에는 createAutoLayout이 없으므로 직접 만든다
function autoLayout(dir, name, gap) {
  var f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.itemSpacing = gap || 0;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

function keyOf(defs, name) {
  var ks = Object.keys(defs);
  for (var i = 0; i < ks.length; i++) if (ks[i].split('#')[0] === name) return ks[i];
  return null;
}

function pageOf(node) {
  while (node && node.type !== 'PAGE') node = node.parent;
  return node;
}

// 초록 글자 구간을 [[ ]]로 다시 감싼다 (만들기와 반대 방향)
function markText(node) {
  if (!node) return '';
  var segs = node.getStyledTextSegments(['fills']);
  return segs.map(function (sg) {
    var f = sg.fills && sg.fills[0];
    var green = f && f.type === 'SOLID' && Math.abs(f.color.r - GREEN.r) < 0.02 && Math.abs(f.color.g - GREEN.g) < 0.02;
    return green ? '[[' + sg.characters + ']]' : sg.characters;
  }).join('');
}

function csvCell(s) {
  s = (s || '').replace(/\r?\n/g, '\\n').trim();
  return /[",\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// 선택한 슬라이드의 글자를 CSV로 읽는다 (Figma에서 직접 고친 내용을 Claude에게 넘길 때)
function readSelection() {
  var sel = figma.currentPage.selection;
  if (!sel.length) throw new Error('읽을 슬라이드(또는 슬라이드가 든 줄 전체)를 먼저 선택해 주세요.');
  var slides = [], captions = [];
  var isSlide = function (n) { return (n.type === 'INSTANCE' || n.type === 'FRAME' || n.type === 'COMPONENT') && !!n.findOne && !!n.findOne(function (c) { return c.name === 'Title' && c.type === 'TEXT'; }); };
  sel.forEach(function (n) {
    if (n.name.indexOf('캡션') > -1) { captions.push(n); return; }
    if (isSlide(n) && n.type === 'INSTANCE') { slides.push(n); return; }
    if ('findAll' in n) {
      n.findAll(function (c) { return c.type === 'INSTANCE' && isSlide(c); }).forEach(function (c) { slides.push(c); });
      n.findAll(function (c) { return c.name.indexOf('캡션') > -1 && c.type === 'FRAME'; }).forEach(function (c) { captions.push(c); });
    }
  });
  var abs = function (n) { return n.absoluteTransform[0][2]; };
  slides.sort(function (a, b) { return abs(a) - abs(b); });
  var get = function (n, name) { var t = n.findOne(function (c) { return c.name === name && c.type === 'TEXT'; }); return t; };
  var lines = ['page,label,topic,title,sub,action,type,image'];
  slides.forEach(function (n) {
    var title = get(n, 'Title');
    var cp = n.componentProperties || {}, imgOn = false;
    Object.keys(cp).forEach(function (k) { if (k.split('#')[0] === 'showImage') imgOn = !!cp[k].value; });
    var type = n.fills && n.fills[0] && n.fills[0].type === 'SOLID' && Math.abs(n.fills[0].color.g - GREEN.g) < 0.02 && Math.abs(n.fills[0].color.r - GREEN.r) < 0.02 ? 'cta'
      : (title && title.fontSize === STYLE.coverTitleSize ? 'cover' : '');
    var txt = function (name) { var t = get(n, name); return t ? t.characters : ''; };
    lines.push([
      txt('Page'), txt('Label'), txt('Topic'),
      type === 'cta' ? txt('Title') : markText(title),
      type === 'cta' ? txt('Sub') : markText(get(n, 'Sub')),
      txt('Action'), type, imgOn ? '1' : ''
    ].map(csvCell).join(','));
  });
  var cap = '';
  captions.forEach(function (c) {
    var texts = c.findAll(function (t) { return t.type === 'TEXT'; });
    cap += texts.filter(function (t) { return t.characters.indexOf('캡션 (복사') !== 0; }).map(function (t) { return t.characters; }).join('\n');
  });
  return { csv: lines.join('\n'), caption: cap, count: slides.length };
}

// 선택한 디자인의 색·글꼴·크기·여백을 요약한다 (다른 파일의 디자인 참고용, MCP 한도와 무관)
function hex(c) {
  var h = function (v) { var s = Math.round(v * 255).toString(16); return s.length < 2 ? '0' + s : s; };
  return ('#' + h(c.r) + h(c.g) + h(c.b)).toUpperCase();
}
function analyzeSelection() {
  var sel = figma.currentPage.selection;
  if (!sel.length) throw new Error('분석할 프레임(게시물)을 먼저 선택해 주세요. 여러 개를 함께 선택해도 돼요.');
  var fills = {}, texts = {}, frames = [], radii = {}, effects = {}, gaps = {}, pads = {}, images = 0, vectors = 0, nodes = 0;
  var add = function (o, k, v) { o[k] = (o[k] || 0) + (v || 1); };
  var paint = function (n, list, area, kind) {
    if (!list || list === figma.mixed) return;
    list.forEach(function (p) {
      if (p.visible === false) return;
      if (p.type === 'SOLID') add(fills, hex(p.color) + (p.opacity !== undefined && p.opacity < 1 ? ' (투명도 ' + Math.round(p.opacity * 100) + '%)' : '') + ' ' + kind, area);
      else if (p.type === 'IMAGE') images++;
      else if (p.type.indexOf('GRADIENT') === 0) add(fills, '그라데이션 ' + p.gradientStops.map(function (s) { return hex(s.color); }).join('→') + ' ' + kind, area);
    });
  };
  var walk = function (n, depth) {
    if (n.visible === false) return;
    nodes++;
    var area = Math.round((n.width || 0) * (n.height || 0) / 1000) || 1;
    if (n.type === 'TEXT') {
      var segs = n.getStyledTextSegments(['fontName', 'fontSize', 'fills', 'letterSpacing', 'lineHeight']);
      segs.forEach(function (s) {
        var col = s.fills && s.fills[0] && s.fills[0].type === 'SOLID' ? hex(s.fills[0].color) : '?';
        var ls = s.letterSpacing && s.letterSpacing.value ? ' 자간' + Math.round(s.letterSpacing.value * 10) / 10 + (s.letterSpacing.unit === 'PERCENT' ? '%' : 'px') : '';
        var lh = s.lineHeight && s.lineHeight.unit !== 'AUTO' ? ' 행간' + Math.round(s.lineHeight.value) + (s.lineHeight.unit === 'PERCENT' ? '%' : 'px') : '';
        var k = s.fontName.family + ' ' + s.fontName.style + ' ' + Math.round(s.fontSize) + 'px ' + col + ls + lh;
        if (!texts[k]) texts[k] = { n: 0, sample: '' };
        texts[k].n += s.characters.length;
        if (texts[k].sample.length < 40) texts[k].sample += (texts[k].sample ? ' / ' : '') + s.characters.replace(/\s+/g, ' ').slice(0, 30);
      });
      return;
    }
    if (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'STAR' || n.type === 'POLYGON') vectors++;
    if ('fills' in n) paint(n, n.fills, area, n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE' ? '[배경]' : '[도형]');
    if ('strokes' in n && n.strokes.length && n.strokeWeight !== figma.mixed) paint(n, n.strokes, 1, '[선 ' + n.strokeWeight + 'px]');
    if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) add(radii, n.cornerRadius + 'px');
    if ('effects' in n && n.effects.length) n.effects.forEach(function (e) { if (e.visible !== false) add(effects, e.type + (e.radius ? ' ' + e.radius + 'px' : '') + (e.color ? ' ' + hex(e.color) + ' ' + Math.round(e.color.a * 100) + '%' : '')); });
    if ('layoutMode' in n && n.layoutMode !== 'NONE') {
      add(gaps, n.layoutMode + ' 간격' + n.itemSpacing);
      add(pads, n.paddingTop + '/' + n.paddingRight + '/' + n.paddingBottom + '/' + n.paddingLeft);
    }
    if ('children' in n) n.children.forEach(function (c) { walk(c, depth + 1); });
  };
  sel.forEach(function (n) { frames.push(n.name + ' (' + Math.round(n.width) + '×' + Math.round(n.height) + ')'); walk(n, 0); });
  var top = function (o, max, fmt) {
    return Object.keys(o).sort(function (a, b) { return (o[b].n || o[b]) - (o[a].n || o[a]); }).slice(0, max).map(fmt).join('\n') || '(없음)';
  };
  var out = [];
  out.push('[Figma 디자인 분석] 파일: ' + figma.root.name + ' / 페이지: ' + figma.currentPage.name);
  out.push('선택 ' + sel.length + '개: ' + frames.slice(0, 20).join(', '));
  out.push('노드 ' + nodes + '개, 이미지 채움 ' + images + '개, 벡터 ' + vectors + '개');
  out.push('\n[색 (면적 순)]\n' + top(fills, 25, function (k) { return '- ' + k + ' : ' + fills[k]; }));
  out.push('\n[글자 스타일 (글자 수 순)]\n' + top(texts, 25, function (k) { return '- ' + k + ' : ' + texts[k].n + '자 「' + texts[k].sample + '」'; }));
  out.push('\n[모서리]\n' + top(radii, 10, function (k) { return '- ' + k + ' : ' + radii[k]; }));
  out.push('\n[효과(그림자·블러)]\n' + top(effects, 10, function (k) { return '- ' + k + ' : ' + effects[k]; }));
  out.push('\n[오토레이아웃 간격 / 안쪽 여백(위/오른/아래/왼)]\n' + top(gaps, 10, function (k) { return '- ' + k + ' : ' + gaps[k]; }) + '\n' + top(pads, 10, function (k) { return '- ' + k + ' : ' + pads[k]; }));
  return { text: out.join('\n'), count: sel.length };
}

// 선택한 슬라이드의 이미지 칸(showImage로 켜진 칸)을 찾아 왼쪽부터 순서대로 돌려준다
async function imageSlots(nodes) {
  var sel = nodes || figma.currentPage.selection;
  if (!sel.length) throw new Error('이미지를 넣을 게시물(7장 묶음 또는 슬라이드들)을 먼저 선택해 주세요.');
  var slides = [];
  var isSlide = function (n) { return n.type === 'INSTANCE' && !!n.findOne(function (c) { return c.name === 'Title' && c.type === 'TEXT'; }); };
  sel.forEach(function (n) {
    if (isSlide(n)) slides.push(n);
    else if (n.findAll) n.findAll(isSlide).forEach(function (c) { slides.push(c); });
  });
  slides.sort(function (a, b) { return a.absoluteTransform[0][2] - b.absoluteTransform[0][2]; });
  var out = [];
  for (var i = 0; i < slides.length; i++) {
    var n = slides[i];
    var cp = n.componentProperties, key = null;
    Object.keys(cp).forEach(function (k) { if (k.split('#')[0] === 'showImage') key = k; });
    if (!key || !cp[key].value) continue;
    var slot = n.findOne(function (c) { return c.componentPropertyReferences && c.componentPropertyReferences.visible === key; });
    if (!slot) continue;
    // 칸 안에 채움이 있는 가장 큰 도형(없으면 칸 자체)
    var target = slot;
    var hasFill = function (c) { return 'fills' in c && c.type !== 'TEXT' && c.fills !== figma.mixed && c.fills.length; };
    var hasImg = function (c) { return hasFill(c) && c.fills.some(function (f) { return f.type === 'IMAGE'; }); };
    var all = slot.findAll ? slot.findAll(function () { return true; }) : [];
    var big = function (a, b) { return b.width * b.height - a.width * a.height; };
    var imgs = all.filter(hasImg).sort(big);
    if (imgs[0]) target = imgs[0];
    else if (!hasFill(slot)) { var cands = all.filter(hasFill).sort(big); if (cands[0]) target = cands[0]; }
    var targets = imgs.length ? imgs : [target];
    if (hasImg(slot) && targets.indexOf(slot) < 0) targets.unshift(slot);
    out.push({ slide: n, slot: slot, target: target, targets: targets });
  }
  return out;
}

// 이미지가 들어간 장의 배치: 이미지 칸을 아래 남는 공간까지 늘리고, 세로 캡처면 글자를 줄여 자리를 더 만든다.
// 초록(cta) 장은 이미지 아래에 흰 바탕을 깔아 초록 캡처와 구분되게 한다.
var SHOT = { titleSize: 72, subSize: 36, gap: 40, colW: 430, colGap: 44 };
// 세로 캡처(높이 > 폭×0.8): 슬라이드를 틀에서 분리해 왼쪽 글 / 오른쪽 캡처(세로로 크게) 배치
// 가로 캡처: 이미지 칸을 아래 남는 공간까지 늘린다
// 초록(cta) 장은 이미지 아래에 흰 바탕을 깔아 초록 캡처와 구분되게 한다
async function fitLayout(x, img) {
  var size = await img.getSizeAsync();
  var tall = size.height > size.width * 0.8;
  var n = x.slide;
  var bg = n.fills !== figma.mixed && n.fills[0] && n.fills[0].type === 'SOLID' ? n.fills[0].color : null;
  if (tall && n.type === 'INSTANCE') {
    n = n.detachInstance();
    x.slide = n;
  }
  var find = function (name) { return n.findOne(function (c) { return c.name === name; }); };
  var title = find('Title'), sub = find('Sub'), wrap = find('Image area'), foot = find('Footer');
  var rect = wrap ? wrap.findAll(function (c) { return 'fills' in c && c.type !== 'TEXT' && c.fills !== figma.mixed && c.fills.some(function (f) { return f.type === 'IMAGE'; }); })
    .sort(function (p, q) { return q.width * q.height - p.width * p.height; })[0] : null;
  var rel = function (nd) { return nd.absoluteTransform[1][2] - n.absoluteTransform[1][2]; };
  var relX = function (nd) { return nd.absoluteTransform[0][2] - n.absoluteTransform[0][2]; };
  if (tall && title && sub && wrap && rect && foot) {
    var left = relX(title);
    var textW = n.width - left * 2 - SHOT.colW - SHOT.colGap;
    title.fontSize = Math.min(title.fontSize, SHOT.titleSize);
    sub.fontSize = Math.min(sub.fontSize, SHOT.subSize);
    title.resize(textW, title.height); title.textAutoResize = 'HEIGHT';
    sub.resize(textW, sub.height); sub.textAutoResize = 'HEIGHT';
    var top = rel(title);
    var h = Math.floor(rel(foot) - top - SHOT.gap);
    wrap.layoutPositioning = 'ABSOLUTE';
    wrap.paddingTop = 0;
    rect.resize(SHOT.colW, h);
    wrap.x = n.width - left - SHOT.colW;
    wrap.y = top;
    x.layout = '세로 캡처: 왼쪽 글 / 오른쪽 이미지';
  } else if (rect && foot) {
    var newH = Math.floor(rel(foot) - rel(rect) - SHOT.gap);
    if (newH > rect.height) rect.resize(rect.width, newH);
    x.layout = '가로 캡처: 이미지 칸 높이 ' + Math.round(rect.height);
  }
  // 초록(cta) 장: 이미지 칸의 바탕·테두리를 없애 투명 PNG 그래픽이 초록 위에 바로 보이게 한다
  if (rect && bg && sameColor(bg, GREEN)) {
    rect.fills = rect.fills.filter(function (f) { return f.type === 'IMAGE'; });
    if ('strokes' in rect) rect.strokes = [];
    if (wrap && wrap !== rect && 'strokes' in wrap) { wrap.strokes = []; if (wrap.fills !== figma.mixed) wrap.fills = wrap.fills.filter(function (f) { return f.type === 'IMAGE'; }); }
  }
}

// 이미지 칸에 파일을 순서대로 채우고 결과 문구를 돌려준다
async function fillImages(slots, files) {
  var nImg = Math.min(slots.length, files.length);
  for (var ii = 0; ii < nImg; ii++) {
    var img = figma.createImage(new Uint8Array(files[ii].bytes));
    slots[ii].targets.forEach(function (tg) {
      tg.fills = tg.fills.map(function (f) { return f.type === 'IMAGE' ? { type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT', visible: f.visible !== false, opacity: f.opacity === undefined ? 1 : f.opacity } : f; });
      if (!tg.fills.some(function (f) { return f.type === 'IMAGE'; })) tg.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }];
    });
    // 칸 안의 안내 글자(예: '이미지')는 숨긴다
    if (slots[ii].slot.findAll) slots[ii].slot.findAll(function (c) { return c.type === 'TEXT'; }).forEach(function (t) { t.visible = false; });
    await fitLayout(slots[ii], img);
  }
  var list = slots.slice(0, nImg).map(function (x, k) {
    return x.slide.name + ' ← ' + files[k].name + (x.layout ? '  [' + x.layout + ']' : '');
  }).join('\n');
  return '이미지 ' + nImg + '개를 넣었어요 (이미지 칸 ' + slots.length + '개, 파일 ' + files.length + '개).\n' + list;
}

// 릴스 스토리보드: 모든 스토리보드는 '릴스 스토리보드' 페이지 한 곳에 둔다 (카드뉴스는 Carousels 페이지)
// 페이지 이름은 띄어쓰기·대소문자를 무시하고 찾는다 ('릴스 스토리 보드'도 같은 페이지로 본다)
var SB_PAGE = '릴스 스토리보드';
function sbKey(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }
async function makeStoryboard(m) {
  await figma.loadAllPagesAsync();
  var page = figma.root.children.filter(function (p) { return sbKey(p.name) === sbKey(SB_PAGE); })[0];
  if (!page) { page = figma.createPage(); page.name = SB_PAGE; }
  await figma.setCurrentPageAsync(page);
  await Promise.all(['Bold', 'Regular'].map(function (s) { return figma.loadFontAsync({ family: FONT, style: s }); }));
  var text = function (str, style, size, col) {
    var t = figma.createText();
    t.fontName = { family: FONT, style: style }; t.fontSize = size; t.characters = str || ' ';
    t.lineHeight = { unit: 'PERCENT', value: 150 };
    t.fills = [{ type: 'SOLID', color: col || INK }];
    return t;
  };
  var boards = m.boards || [m];
  var made = [], log = [];
  for (var bi = 0; bi < boards.length; bi++) {
    var sb = boards[bi];
    var board = autoLayout('VERTICAL', sb.title, 40);
    board.paddingLeft = board.paddingRight = board.paddingTop = board.paddingBottom = 64;
    board.fills = [{ type: 'SOLID', color: WHITE }];
    board.cornerRadius = 24;
    board.appendChild(text(sb.title, 'Bold', 48));
    if (sb.note) board.appendChild(text(sb.note, 'Regular', 28, { r: 0.45, g: 0.45, b: 0.45 }));
    var row = autoLayout('HORIZONTAL', '장면', 48);
    board.appendChild(row);
    var W = 540, H = 960; // 1080x1920의 절반 크기로 보여 준다
    for (var i = 0; i < sb.scenes.length; i++) {
      var sc = sb.scenes[i];
      var col = autoLayout('VERTICAL', sc.name, 20);
      var r = figma.createRectangle();
      r.name = sc.file.name; r.resize(W, H); r.cornerRadius = 16;
      r.fills = [{ type: 'IMAGE', scaleMode: 'FIT', imageHash: figma.createImage(new Uint8Array(sc.file.bytes)).hash }];
      r.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.87, b: 0.84 } }]; r.strokeWeight = 2;
      col.appendChild(r);
      col.appendChild(text(sc.name, 'Bold', 32, GREEN));
      if (sc.note) { var n = text(sc.note, 'Regular', 24); col.appendChild(n); n.resize(W, n.height); n.textAutoResize = 'HEIGHT'; }
      row.appendChild(col);
    }
    // 같은 제목이 이미 있으면 그 자리에서 바꾸고(중복 방지), 없으면 맨 아래에 쌓는다
    var old = page.children.filter(function (c) { return c !== board && c.name === sb.title; });
    if (old.length) {
      board.x = old[0].x; board.y = old[0].y;
      old.forEach(function (o) { o.remove(); });
      log.push('바꿈: ' + sb.title);
    } else {
      var bottom = 0;
      page.children.forEach(function (c) { if (c !== board) bottom = Math.max(bottom, c.y + c.height + 200); });
      board.x = 0; board.y = bottom;
      log.push('추가: ' + sb.title);
    }
    made.push(board);
  }
  figma.currentPage.selection = made;
  figma.viewport.scrollAndZoomIntoView(made);
  return '완료: "' + page.name + '" 페이지에 스토리보드 ' + made.length + '개\n' + log.join('\n');
}

figma.ui.onmessage = async function (m) {
  try {
    if (m.mode === 'storyboard') {
      figma.ui.postMessage({ msg: await makeStoryboard(m) });
      return;
    }
    if (m.mode === 'images') {
      var slots = await imageSlots();
      if (!slots.length) throw new Error('선택한 슬라이드에 이미지 칸(image=1)이 없어요.');
      figma.ui.postMessage({ msg: await fillImages(slots, m.files) });
      return;
    }
    if (m.mode === 'analyze') {
      var an = analyzeSelection();
      figma.ui.postMessage({ analyze: an.text, msg: an.count + '개를 분석했어요. "분석 결과 복사"를 눌러 Claude 대화창에 붙여 넣어 주세요.' });
      return;
    }
    if (m.mode === 'read') {
      var r = readSelection();
      figma.ui.postMessage({ read: r, msg: '선택한 ' + r.count + '장' + (r.caption ? ' + 캡션' : '') + '을 읽었어요. "Claude에게 넘길 내용 복사"를 눌러 대화창에 붙여 넣어 주세요.' });
      return;
    }
    var comp = null;
    // 1) 선택한 슬라이드(인스턴스)가 있으면 그 원본을 쓴다
    var sel = figma.currentPage.selection;
    for (var si = 0; si < sel.length && !comp; si++) {
      if (sel[si].type === 'INSTANCE') {
        var mc = await sel[si].getMainComponentAsync();
        if (mc && mc.name.indexOf('BM Slide') === 0) comp = mc;
      } else if (sel[si].type === 'COMPONENT' && sel[si].name.indexOf('BM Slide') === 0) comp = sel[si];
    }
    // 2) 없으면 파일 전체에서 찾는다
    if (!comp) {
      await figma.loadAllPagesAsync();
      var comps = figma.root.findAllWithCriteria({ types: ['COMPONENT'] }).filter(function (n) { return n.name.indexOf('BM Slide') === 0; });
      if (comps.length) comp = comps[0];
    }
    if (!comp) throw new Error("'" + COMP_NAME + "' 컴포넌트를 찾지 못했어요.\n지금 연 파일: " + figma.root.name + "\n빅무브 #1 7장이 있는 파일(Shu-Ha-Ri 사본)에서 실행했는지 확인하거나, 1번 게시물 슬라이드 한 장을 선택한 뒤 다시 눌러 주세요.");
    var page = pageOf(comp);
    await figma.setCurrentPageAsync(page);
    await Promise.all(['Black', 'Bold', 'Medium', 'Regular'].map(function (s) { return figma.loadFontAsync({ family: FONT, style: s }); }));

    applyStyle(comp);
    var F = FONT, BOLD = 'Bold', bgCol = BG, inkCol = INK;
    if (m.bumin) {
      var bf = await findBuminFont();
      comp = await buminComp(comp, bf);
      applyStyle(comp);
      F = bf.family; BOLD = buminStyle(bf, 'Bold'); bgCol = BUMIN.bg; inkCol = BUMIN.ink;
    }
    if (m.mode === 'style') {
      figma.ui.postMessage({ msg: '틀 업데이트 완료: 이미 만든 슬라이드에도 반영됐어요.\n(표지 제목은 표지 크기를 따로 써서 그대로예요)' });
      return;
    }

    var maxY = -Infinity, minX = Infinity;
    page.children.forEach(function (c) { maxY = Math.max(maxY, c.y + c.height); minX = Math.min(minX, c.x); });

    if (m.mode === 'covers') {
      var crow = autoLayout('HORIZONTAL', '빅무브 하이라이트 커버', 60);
      crow.x = minX; crow.y = maxY + 300;
      COVERS.forEach(function (cv, ci) {
        var f = figma.createFrame();
        f.name = 'bigmove-cover-' + String(ci + 1).padStart(2, '0') + '-' + cv.key;
        f.resize(1080, 1920);
        f.fills = [{ type: 'SOLID', color: GREEN }];
        var icon = figma.createNodeFromSvg(cv.svg);
        icon.name = 'icon';
        icon.resize(360, 360);
        f.appendChild(icon);
        icon.x = 360; icon.y = 780;  // 가운데 (하이라이트는 가운데 원만 보임)
        crow.appendChild(f);
      });
      figma.currentPage.selection = crow.children.slice();
      figma.viewport.scrollAndZoomIntoView([crow]);
      figma.ui.postMessage({ msg: '하이라이트 커버 ' + COVERS.length + '개를 만들었어요. 선택된 상태라 바로 Export 하면 돼요.' });
      return;
    }

    var rows = parseCSV(m.csv);
    if (rows.length < 2) throw new Error('CSV에 머리글과 슬라이드가 필요해요.');
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var data = rows.slice(1).map(function (r) {
      var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); }); return o;
    });
    var defs = comp.componentPropertyDefinitions;
    var K = {};
    ['action', 'label', 'topic', 'page', 'title', 'sub', 'showImage'].forEach(function (n) { K[n] = keyOf(defs, n); });

    var post = (m.post || '00').replace(/[^0-9A-Za-z-]/g, '');
    var story = !!m.story;  // 스토리(1080x1920): 슬라이드를 세로 가운데에 두고 위아래는 인스타 화면 요소 자리로 비움

    var row = autoLayout('HORIZONTAL', '빅무브 #' + post + (m.bumin ? ' 부민 스타일' : '') + ' (' + data.length + '장)', 60);
    row.fills = [];
    row.x = minX; row.y = maxY + 300;

    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var type = (d.type || '').toLowerCase();
      var inst = comp.createInstance();
      var nm = (story ? 'bigmove-story-' : 'bigmove-') + post + (m.bumin ? '-bumin' : '') + '-' + String(i + 1).padStart(2, '0');
      if (story) {
        var sf = figma.createFrame();
        sf.name = nm;
        sf.resize(1080, 1920);
        sf.fills = [{ type: 'SOLID', color: type === 'cta' ? GREEN : bgCol }];
        sf.appendChild(inst);
        inst.x = 0; inst.y = 285;
        row.appendChild(sf);
        inst.name = 'slide';
      } else {
        row.appendChild(inst);
        inst.name = nm;
      }
      var t = stripMarks(d.title), s = stripMarks(d.sub);
      var props = {};
      props[K.page] = d.page === '-' ? ' ' : (/^\d+\/\d+$/.test(d.page || '') ? d.page : ((i + 1) + '/' + data.length));  // '-'는 비움  // 엑셀이 날짜로 바꾼 값은 무시
      props[K.label] = d.label || ' ';
      props[K.topic] = d.topic || ' ';
      props[K.title] = t.text || ' ';
      props[K.sub] = s.text || ' ';
      props[K.action] = d.action === '-' ? ' ' : (d.action || (type === 'cta' ? '저장해 두기' : '넘겨 보기 →'));
      props[K.showImage] = /^(1|y|yes|o|true)$/i.test(d.image || '');
      inst.setProperties(props);

      var titleNode = inst.findOne(function (n) { return n.name === 'Title'; });
      var subNode = inst.findOne(function (n) { return n.name === 'Sub'; });
      if (type === 'cover') titleNode.fontSize = STYLE.coverTitleSize;
      if (type === 'cta') {
        inst.fills = [{ type: 'SOLID', color: GREEN }];
        inst.findAll(function (n) { return n.type === 'TEXT'; }).forEach(function (n) { n.fills = [{ type: 'SOLID', color: WHITE }]; });
        inst.findOne(function (n) { return n.name === 'Chip'; }).fills = [{ type: 'SOLID', color: WHITE }];
        inst.findOne(function (n) { return n.name === 'Label'; }).fills = [{ type: 'SOLID', color: GREEN }];
      }
      var hl = type === 'cta' ? WHITE : GREEN;
      t.ranges.forEach(function (r) { titleNode.setRangeFills(r[0], r[1], [{ type: 'SOLID', color: hl }]); });
      s.ranges.forEach(function (r) {
        subNode.setRangeFills(r[0], r[1], [{ type: 'SOLID', color: hl }]);
        subNode.setRangeFontName(r[0], r[1], { family: F, style: BOLD });
      });
    }

    // 캡션 프레임 (복사해서 붙여 넣기용)
    var box = autoLayout('VERTICAL', '#' + post + ' 캡션', 32);
    box.paddingLeft = box.paddingRight = box.paddingTop = box.paddingBottom = 64;
    box.fills = [{ type: 'SOLID', color: WHITE }];
    box.cornerRadius = 24;
    box.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.87, b: 0.84 } }];
    box.strokeWeight = 2;
    var h = figma.createText();
    h.fontName = { family: F, style: BOLD }; h.fontSize = 36; h.characters = '캡션 (복사해서 붙여 넣기)';
    h.fills = [{ type: 'SOLID', color: inkCol }];
    box.appendChild(h);
    var ct = figma.createText();
    ct.fontName = { family: F, style: 'Regular' }; ct.fontSize = 32;
    ct.lineHeight = { unit: 'PERCENT', value: 160 };
    ct.characters = (m.caption || '').trim() || '(캡션 없음)';
    ct.fills = [{ type: 'SOLID', color: inkCol }];
    box.appendChild(ct);
    ct.resize(900, ct.height); ct.textAutoResize = 'HEIGHT';
    box.x = row.x + row.width + 120; box.y = row.y;

    var imgMsg = '';
    if (m.files && m.files.length) {
      var newSlots = await imageSlots(row.children.slice());
      imgMsg = '\n' + (newSlots.length ? await fillImages(newSlots, m.files) : '이미지 칸(image=1)이 없어서 이미지는 넣지 않았어요.');
    }
    figma.currentPage.selection = row.children.slice();
    figma.viewport.scrollAndZoomIntoView([row, box]);
    figma.ui.postMessage({ msg: '완료: ' + data.length + '장 + 캡션 프레임을 만들었어요.' + (m.bumin ? ' [부민 스타일: ' + F + ']' : ' [기본 스타일: 부민 스타일 체크 안 됨]') + '\n7장이 선택된 상태라 바로 Export 하면 돼요.' + imgMsg });
  } catch (e) {
    figma.ui.postMessage({ msg: '오류: ' + (e && e.message ? e.message : e) });
  }
};
