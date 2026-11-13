const ts=require("typescript");
const fs=require("fs"),path=require("path");
// Två lägen. Utan argument: tecknen (tankstreck, mittpunkt, pilar).
// Med --ord: ordvalen som får texten att läsa som maskinskriven, se
// "Copy- och UI-regler" punkt 20-27 i CLAUDE.md. Ett eget mönster går
// fortfarande att skicka som argument.
const ORD="riktig|duell|helt gratis|\\bkomplett|lås(er|es|a)? upp|spaced repetition|\\btiers?\\b|smart|effektiv|snabbt och|enkelt och|i din egen takt|allt du|oavsett om|inte bara|[a-zåäö]!(\\s|\"|'|`|$)";
const arg=process.argv[2];
const re=arg==="--ord"?new RegExp(ORD,"iu"):new RegExp(arg||"\u2014|\u00b7|\u2192|\u2190|\\s\u2013\\s","u");
// Undantag i ordläget: citat från personer, mejl, serverloggar, admin och
// tekniska nycklar. En enstaka rad undantas med kommentaren "copy-ok" på
// samma rad eller raden före.
const SKIP=/omdomen\.ts|email-templates\.ts|produktzon\.ts|\.server\.ts|\.functions\.ts|[\\/]admin|Admin[A-Z]|[\\/]mcp[\\/]|types[\\/]/;
function walk(d,o=[]){for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory())walk(p,o);else if(/\.(tsx?)$/.test(f)&&!/\.test\.|routeTree/.test(f))o.push(p);}return o;}
let n=0;
for(const p of walk("src")){
  if(arg==="--ord"&&SKIP.test(p))continue;
  const src=fs.readFileSync(p,"utf8");
  const lines=src.split("\n");
  const sf=ts.createSourceFile(p,src,ts.ScriptTarget.Latest,true,p.endsWith("x")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  (function v(node){
    const k=node.kind;
    if(k===ts.SyntaxKind.StringLiteral||k===ts.SyntaxKind.NoSubstitutionTemplateLiteral||k===ts.SyntaxKind.TemplateHead||k===ts.SyntaxKind.TemplateMiddle||k===ts.SyntaxKind.TemplateTail||k===ts.SyntaxKind.JsxText){
      const t=node.getText(sf);
      if(re.test(t)){
        const {line}=sf.getLineAndCharacterOfPosition(node.getStart(sf));
        if(arg==="--ord"&&/copy-ok/.test((lines[line-1]||"")+lines[line]))return;
        console.log(`${p}:${line+1}: ${t.replace(/\s+/g," ").trim().slice(0,170)}`);n++;
      }
    }
    ts.forEachChild(node,v);
  })(sf);
}
console.error("träffar",n);
