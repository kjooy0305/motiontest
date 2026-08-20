/* ═══════════════════════════════════════════════════════════
   쉬운 입력 → KaTeX 변환기
   DOM 을 건드리지 않는 순수 함수이므로 그대로 테스트할 수 있다.

   지원 문법
     a/b            \frac{a}{b}         (괄호는 자동으로 벗겨짐)
     x^2  x_(i+1)   x^{2}  x_{i+1}
     sqrt(x)        \sqrt{x}
     root(3)(x)     \sqrt[3]{x}
     sum_(k=1)^n    \sum_{k=1}^{n}
     lim(x->0)      \lim_{x \to 0}
     abs(x)         \left| x \right|
     mat(1,2;3,4)   \begin{pmatrix}...\end{pmatrix}
     "글자"          \text{글자}
     alpha  <=  ->  oo  RR  sup  inf  ...
   ═══════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // kind: const(그대로) / unary(인자1) / func2(괄호 안 인자2) / matrix / bigop / lim
  const TABLE = [
    // ── 여러 글자 기호 (긴 것부터 매칭된다) ──
    ['<=>', 'const', '\\Leftrightarrow'],
    ['<->', 'const', '\\leftrightarrow'],
    ['|->', 'const', '\\mapsto'],
    ['->', 'const', '\\to'],
    ['<-', 'const', '\\gets'],
    ['=>', 'const', '\\Rightarrow'],
    ['<=', 'const', '\\le'],
    ['>=', 'const', '\\ge'],
    ['!=', 'const', '\\ne'],
    ['~=', 'const', '\\approx'],
    ['+-', 'const', '\\pm'],
    ['-+', 'const', '\\mp'],
    ['-:', 'const', '\\div'],
    ['**', 'const', '\\ast'],
    ['::', 'const', '\\colon'],
    ['...', 'const', '\\cdots'],
    ['*', 'const', '\\cdot'],

    // ── 구조 ──
    ['sqrt', 'unary', '\\sqrt'],
    ['root', 'func2', 'ROOT'],
    ['frac', 'func2', 'FRAC'],
    ['binom', 'func2', 'BINOM'],
    ['choose', 'func2', 'BINOM'],
    ['abs', 'unary', 'ABS'],
    ['norm', 'unary', 'NORM'],
    ['floor', 'unary', 'FLOOR'],
    ['ceil', 'unary', 'CEIL'],
    ['vec', 'unary', '\\vec'],
    ['hat', 'unary', '\\hat'],
    ['bar', 'unary', '\\bar'],
    ['dot', 'unary', '\\dot'],
    ['ddot', 'unary', '\\ddot'],
    ['tilde', 'unary', '\\tilde'],
    ['ul', 'unary', '\\underline'],
    ['bb', 'unary', '\\mathbf'],
    ['bbb', 'unary', '\\mathbb'],
    ['cal', 'unary', '\\mathcal'],
    ['rm', 'unary', '\\mathrm'],
    ['text', 'unary', '\\text'],
    ['mat', 'matrix', 'pmatrix'],
    ['pmat', 'matrix', 'pmatrix'],
    ['bmat', 'matrix', 'bmatrix'],
    ['vmat', 'matrix', 'vmatrix'],
    ['cases', 'matrix', 'cases'],
    ['array', 'matrix', 'aligned'],

    // ── 큰 연산자 ──
    ['sum', 'bigop', '\\sum'],
    ['prod', 'bigop', '\\prod'],
    ['iiint', 'bigop', '\\iiint'],
    ['iint', 'bigop', '\\iint'],
    ['oint', 'bigop', '\\oint'],
    ['int', 'bigop', '\\int'],
    ['lim', 'lim', '\\lim'],
    ['uuu', 'bigop', '\\bigcup'],
    ['nnn', 'bigop', '\\bigcap'],

    // ── 함수 ──
    ['arcsin', 'const', '\\arcsin'], ['arccos', 'const', '\\arccos'], ['arctan', 'const', '\\arctan'],
    ['sinh', 'const', '\\sinh'], ['cosh', 'const', '\\cosh'], ['tanh', 'const', '\\tanh'],
    ['sin', 'const', '\\sin'], ['cos', 'const', '\\cos'], ['tan', 'const', '\\tan'],
    ['csc', 'const', '\\csc'], ['sec', 'const', '\\sec'], ['cot', 'const', '\\cot'],
    ['log', 'const', '\\log'], ['ln', 'const', '\\ln'], ['exp', 'const', '\\exp'],
    ['gcd', 'const', '\\gcd'], ['lcm', 'const', '\\operatorname{lcm}'],
    ['det', 'const', '\\det'], ['dim', 'const', '\\dim'], ['ker', 'const', '\\ker'],
    ['max', 'bigop', '\\max'], ['min', 'bigop', '\\min'],
    ['mod', 'const', '\\bmod'],

    // ── 집합·논리 ──
    ['notin', 'const', '\\notin'],
    ['sube', 'const', '\\subseteq'],
    ['supe', 'const', '\\supseteq'],
    ['subset', 'const', '\\subset'],
    ['supset', 'const', '\\supset'],
    ['sub', 'const', '\\subset'],
    ['sup', 'bigop', '\\sup'],
    ['inf', 'bigop', '\\inf'],
    ['in', 'const', '\\in'],
    ['uu', 'const', '\\cup'],
    ['nn', 'const', '\\cap'],
    ['empty', 'const', '\\emptyset'],
    ['AA', 'const', '\\forall'],
    ['EE', 'const', '\\exists'],
    ['not', 'const', '\\neg'],
    ['and', 'const', '\\land'],
    ['or', 'const', '\\lor'],
    ['RR', 'const', '\\mathbb{R}'], ['NN', 'const', '\\mathbb{N}'],
    ['ZZ', 'const', '\\mathbb{Z}'], ['QQ', 'const', '\\mathbb{Q}'],
    ['CC', 'const', '\\mathbb{C}'],
    ['therefore', 'const', '\\therefore'],
    ['because', 'const', '\\because'],

    // ── 그리스 ──
    ['alpha','const','\\alpha'], ['beta','const','\\beta'], ['gamma','const','\\gamma'],
    ['delta','const','\\delta'], ['epsilon','const','\\epsilon'], ['varepsilon','const','\\varepsilon'],
    ['zeta','const','\\zeta'], ['eta','const','\\eta'], ['theta','const','\\theta'],
    ['vartheta','const','\\vartheta'], ['iota','const','\\iota'], ['kappa','const','\\kappa'],
    ['lambda','const','\\lambda'], ['mu','const','\\mu'], ['nu','const','\\nu'],
    ['xi','const','\\xi'], ['pi','const','\\pi'], ['rho','const','\\rho'],
    ['sigma','const','\\sigma'], ['tau','const','\\tau'], ['upsilon','const','\\upsilon'],
    ['varphi','const','\\varphi'], ['phi','const','\\phi'], ['chi','const','\\chi'],
    ['psi','const','\\psi'], ['omega','const','\\omega'],
    ['Gamma','const','\\Gamma'], ['Delta','const','\\Delta'], ['Theta','const','\\Theta'],
    ['Lambda','const','\\Lambda'], ['Xi','const','\\Xi'], ['Pi','const','\\Pi'],
    ['Sigma','const','\\Sigma'], ['Phi','const','\\Phi'], ['Psi','const','\\Psi'],
    ['Omega','const','\\Omega'],

    // ── 기타 기호 ──
    ['infty', 'const', '\\infty'],
    ['oo', 'const', '\\infty'],
    ['partial', 'const', '\\partial'],
    ['del', 'const', '\\partial'],
    ['nabla', 'const', '\\nabla'],
    ['grad', 'const', '\\nabla'],
    ['deg', 'const', '^{\\circ}'],
    ['xx', 'const', '\\times'],
    ['o+', 'const', '\\oplus'],
    ['ox', 'const', '\\otimes'],
    ['equiv', 'const', '\\equiv'],
    ['prop', 'const', '\\propto'],
    ['cdots', 'const', '\\cdots'],
    ['vdots', 'const', '\\vdots'],
    ['ddots', 'const', '\\ddots'],
    ['quad', 'const', '\\quad'],

    // ── 미분 기호 (분수 인자로 쓰이면 앞의 얇은 공백이 제거된다) ──
    ['dx','const','\\,dx'], ['dy','const','\\,dy'], ['dz','const','\\,dz'],
    ['dt','const','\\,dt'], ['du','const','\\,du'], ['dv','const','\\,dv'],
    ['dr','const','\\,dr'], ['ds','const','\\,ds'], ['dA','const','\\,dA'],
  ];

  // 긴 것이 먼저 매칭되도록 정렬
  // 뒤에 붙은 괄호를 인자로 흡수할 함수들
  const FUNCTION_LIKE = /^\\(sin|cos|tan|csc|sec|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|det|dim|ker|gcd|max|min)$/;

  const SORTED = TABLE.slice().sort((a, b) => b[0].length - a[0].length);

  const LEFT = {'(': '(', '[': '[', '{': null};   // null = 보이지 않는 묶음
  const RIGHT = {')': ')', ']': ']', '}': null};

  /* ── 토큰화 ────────────────────────────── */
  function tokenize(src) {
    const raw = [];
    let i = 0;
    const n = src.length;
    let sawSpace = false;
    // push 할 때 "바로 앞에 공백이 있었는지"(sp)를 함께 기록한다
    const out = {
      push(t) { t.sp = sawSpace; sawSpace = false; raw.push(t); },
    };

    while (i < n) {
      const c = src[i];

      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { sawSpace = true; i++; continue; }

      // 문자열 "..."  → \text{...}
      if (c === '"') {
        const end = src.indexOf('"', i + 1);
        const body = end === -1 ? src.slice(i + 1) : src.slice(i + 1, end);
        out.push({k: 'const', v: '\\text{' + body + '}'});
        i = end === -1 ? n : end + 1;
        continue;
      }

      // 이미 LaTeX 명령을 쓴 경우 그대로 통과시킨다.
      // 뒤따르는 {…} · […] 인자까지 통째로 붙여야 \frac{a}{b} 가 보존된다.
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
        if (m) {
          let rawCmd = m[0];
          let j = i + m[0].length;
          while (j < n) {
            let k = j;
            while (k < n && (src[k] === ' ' || src[k] === '\t')) k++;
            if (src[k] !== '{' && src[k] !== '[') break;
            const open = src[k], close = open === '{' ? '}' : ']';
            let depth = 0, e = k;
            for (; e < n; e++) {
              if (src[e] === open) depth++;
              else if (src[e] === close) { depth--; if (depth === 0) { e++; break; } }
            }
            if (depth !== 0) break;            // 짝이 안 맞으면 붙이지 않는다
            rawCmd += src.slice(k, e);
            j = e;
          }
          out.push({k: 'const', v: rawCmd});
          i = j;
          continue;
        }
      }

      // 괄호
      if (LEFT.hasOwnProperty(c)) { out.push({k: 'lb', v: c, show: LEFT[c]}); i++; continue; }
      if (RIGHT.hasOwnProperty(c)) { out.push({k: 'rb', v: c, show: RIGHT[c]}); i++; continue; }

      // 숫자
      if (/[0-9]/.test(c)) {
        const m = /^[0-9]+(\.[0-9]+)?/.exec(src.slice(i));
        out.push({k: 'atom', v: m[0]});
        i += m[0].length;
        continue;
      }

      // 표에 있는 기호 (긴 것 우선)
      let hit = null;
      for (const [key, kind, tex] of SORTED) {
        if (src.startsWith(key, i)) {
          // 알파벳 기호는 단어 중간에서 끊기지 않도록 뒤 글자를 확인
          if (/[a-zA-Z]$/.test(key)) {
            const after = src[i + key.length];
            if (after && /[a-zA-Z]/.test(after)) {
              // 단어가 이어지면 더 긴 후보를 계속 찾는다 (없으면 낱글자로 처리)
              continue;
            }
          }
          hit = [key, kind, tex];
          break;
        }
      }
      if (hit) {
        out.push({k: hit[1], v: hit[2], src: hit[0]});
        i += hit[0].length;
        continue;
      }

      // 중위 연산자
      if (c === '/' || c === '^' || c === '_') { out.push({k: 'infix', v: c}); i++; continue; }
      if (c === ',') { out.push({k: 'comma', v: ','}); i++; continue; }
      if (c === ';') { out.push({k: 'semi', v: ';'}); i++; continue; }
      if (c === '&') { out.push({k: 'amp', v: '&'}); i++; continue; }

      // 나머지 한 글자
      out.push({k: 'atom', v: escapeAtom(c)});
      i++;
    }
    return raw;
  }

  function escapeAtom(c) {
    if (c === '%') return '\\%';
    if (c === '#') return '\\#';
    if (c === '$') return '\\$';
    if (c === '~') return '\\sim';
    if (c === '<') return '\\lt';
    if (c === '>') return '\\gt';
    return c;
  }

  /* ── 파서 ─────────────────────────────── */
  function parse(tokens) {
    let p = 0;
    const peek = () => tokens[p];
    const next = () => tokens[p++];

    // 인자로 쓸 때: 바깥 괄호를 벗기고 앞의 얇은 공백도 제거
    function argOf(node) {
      if (!node) return '';
      const s = node.group !== undefined ? node.group : node.tex;
      return s.replace(/^\\,\s*/, '');
    }

    function parseSimple() {
      const t = peek();
      if (!t) return null;

      if (t.k === 'lb') {
        next();
        const inner = parseSeq(tk => tk.k === 'rb');
        const closing = peek();
        if (closing && closing.k === 'rb') next();
        const showL = t.show;
        if (showL === null) return {tex: inner, group: inner};
        const showR = showL === '(' ? ')' : ']';
        // 내용이 높은 경우에만 \left \right 로 키운다 (f(x) 까지 늘릴 필요는 없다)
        const tall = /\\frac|\\dfrac|\\sqrt|\\sum|\\prod|\\int|\\begin|\\binom|[\^_]\{/.test(inner);
        const tex = tall
          ? '\\left' + showL + ' ' + inner + ' \\right' + showR
          : showL + inner + showR;
        return {tex: tex, group: inner};
      }

      if (t.k === 'unary') {
        next();
        // sqrt[3](x) 형태 지원
        if (t.v === '\\sqrt' && peek() && peek().k === 'lb' && peek().v === '[') {
          const idx = parseSimple();
          const arg = parseSimple();
          const s = '\\sqrt[' + argOf(idx) + ']{' + argOf(arg) + '}';
          return {tex: s, group: s};
        }
        const arg = parseSimple();
        const a = argOf(arg);
        let s;
        switch (t.v) {
          case 'ABS':   s = '\\left| ' + a + ' \\right|'; break;
          case 'NORM':  s = '\\left\\| ' + a + ' \\right\\|'; break;
          case 'FLOOR': s = '\\left\\lfloor ' + a + ' \\right\\rfloor'; break;
          case 'CEIL':  s = '\\left\\lceil ' + a + ' \\right\\rceil'; break;
          default:      s = t.v + '{' + a + '}';
        }
        return {tex: s, group: s};
      }

      if (t.k === 'func2') {
        next();
        const args = parseArgList(2);
        let s;
        if (t.v === 'ROOT') s = '\\sqrt[' + args[0] + ']{' + args[1] + '}';
        else if (t.v === 'FRAC') s = '\\frac{' + args[0] + '}{' + args[1] + '}';
        else s = '\\binom{' + args[0] + '}{' + args[1] + '}';
        return {tex: s, group: s};
      }

      if (t.k === 'matrix') {
        next();
        const s = parseMatrix(t.v);
        return {tex: s, group: s};
      }

      if (t.k === 'bigop' || t.k === 'lim' || t.k === 'const' || t.k === 'atom') {
        next();
        const callable = (t.k === 'atom' && /^[A-Za-z0-9]+$/.test(t.v)) ||
                         (t.k === 'const' && FUNCTION_LIKE.test(t.v));
        return {tex: t.v, big: t.k === 'bigop', isLim: t.k === 'lim', callable: callable};
      }

      if (t.k === 'comma') { next(); return {tex: ','}; }
      if (t.k === 'semi')  { next(); return {tex: ';'}; }
      if (t.k === 'amp')   { next(); return {tex: '&'}; }

      // 여기까지 왔으면 처리 대상이 아님 — 한 칸 넘기고 빈 노드
      next();
      return {tex: ''};
    }

    // func2 의 (a, b) 인자 목록
    function parseArgList(count) {
      const args = [];
      if (peek() && peek().k === 'lb') {
        next();
        while (true) {
          const cell = parseSeq(tk => tk.k === 'rb' || tk.k === 'comma');
          args.push(cell.replace(/^\\,\s*/, ''));
          const t = peek();
          if (t && t.k === 'comma') { next(); continue; }
          if (t && t.k === 'rb') { next(); }
          break;
        }
      }
      // 괄호를 따로 쓴 형태: root(3)(x)
      while (args.length < count && peek() && peek().k === 'lb') {
        const nd = parseSimple();
        args.push(argOf(nd));
      }
      while (args.length < count) args.push('');
      return args;
    }

    function parseMatrix(env) {
      const rows = [];
      let row = [];
      if (peek() && peek().k === 'lb') {
        next();
        while (true) {
          const cell = parseSeq(tk => tk.k === 'rb' || tk.k === 'comma' || tk.k === 'semi');
          row.push(cell);
          const t = peek();
          if (t && t.k === 'comma') { next(); continue; }
          if (t && t.k === 'semi') { next(); rows.push(row); row = []; continue; }
          if (t && t.k === 'rb') next();
          break;
        }
      }
      rows.push(row);
      const body = rows.map(r => r.join(' & ')).join(' \\\\ ');
      return '\\begin{' + env + '} ' + body + ' \\end{' + env + '}';
    }

    // S 다음에 오는 _ ^ 를 붙인다
    function parseInter() {
      const base = parseSimple();
      if (!base) return null;

      // lim(x->0) 처럼 괄호가 바로 오면 아래첨자로 본다
      if (base.isLim && peek() && peek().k === 'lb' && peek().v === '(') {
        const g = parseSimple();
        const s = base.tex + '_{' + argOf(g) + '}';
        return {tex: s, group: s};
      }

      // f(x) · \sin(x) · P(B) 처럼 바로 뒤에 붙은 괄호는 한 덩어리로 묶는다.
      // 공백이 있으면(1/2 (x+1)) 묶지 않는다.
      function absorbCall(node) {
        if (!node || !node.callable) return node;
        const t2 = peek();
        if (!t2 || t2.k !== 'lb' || t2.v !== '(' || t2.sp) return node;
        const g = parseSimple();
        const s2 = node.tex + (g.tex.charAt(0) === '\\' ? g.tex : '(' + argOf(g) + ')');
        return {tex: s2, group: s2};
      }

      // log_2(x) 처럼 첨자가 먼저 오는 경우를 위해 첨자를 읽고,
      // 괄호 흡수는 그 앞뒤 어느 쪽에 있든 처리한다.
      let head = absorbCall(base);          // cos(theta) 를 먼저 한 덩어리로

      let sub = null, sup = null;
      for (let guard = 0; guard < 4; guard++) {
        const t = peek();
        if (!t || t.k !== 'infix') break;
        if (t.v === '_' && sub === null) { next(); sub = parseSimple(); continue; }
        if (t.v === '^' && sup === null) { next(); sup = parseSimple(); continue; }
        break;
      }

      if (sub === null && sup === null) return head;

      let s = head.tex;
      if (sub !== null) s += '_{' + argOf(sub) + '}';
      if (sup !== null) s += '^{' + argOf(sup) + '}';
      // log_2(x) : 첨자 뒤에 붙은 괄호도 흡수
      return absorbCall({tex: s, group: s, callable: base.callable && head === base});
    }

    // 나열 + 분수(/) 처리
    function parseSeq(stop) {
      const parts = [];
      while (true) {
        const t = peek();
        if (!t) break;
        if (stop && stop(t)) break;

        if (t.k === 'infix' && t.v === '/') {
          next();
          const right = parseInter();
          const left = parts.pop();
          const s = '\\frac{' + argOf(left) + '}{' + argOf(right) + '}';
          parts.push({tex: s, group: s});
          continue;
        }

        const node = parseInter();
        if (!node) break;
        parts.push(node);
      }
      return joinParts(parts.map(x => x.tex).filter(s => s !== ''));
    }

    // 읽기 좋게 이어붙인다.
    //  · \command 로 끝난 뒤에는 띄어야 한다 (\sin x 가 \sinx 가 되면 안 됨)
    //  · \command 앞에서도 띄우면 읽기 좋다
    //  · 그 밖의 글자·숫자·기호끼리는 붙여서 2a, b^{2}-4ac 처럼 촘촘하게
    function joinParts(list) {
      const endsWithCmd = s => /\\[a-zA-Z]+$/.test(s);
      let out = '';
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const prev = list[i - 1];
        const need = i > 0 && (
          endsWithCmd(prev) ||
          s.charAt(0) === '\\' ||
          (prev.slice(-1) === '}' && /^[A-Za-z0-9]/.test(s))
        );
        if (need) out += ' ';
        out += s;
      }
      return out;
    }

    return parseSeq(null);
  }

  /* ── 마무리 정리 ──────────────────────── */
  function tidy(s) {
    return s
      .replace(/\s+/g, ' ')
      .replace(/\s+([,;])/g, '$1')
      .replace(/\{\s+/g, '{')
      .replace(/\s+\}/g, '}')
      .trim();
  }

  function easyToTex(src) {
    if (!src || !src.trim()) return '';
    return tidy(parse(tokenize(src)));
  }

  const api = {easyToTex: easyToTex, _tokenize: tokenize};
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Convert = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
