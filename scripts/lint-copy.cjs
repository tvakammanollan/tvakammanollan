const ts=require("typescript");
const fs=require("fs"),path=require("path");
const re=new RegExp(process.argv[2]||"\u2014|\u00b7|\u2192|\u2190|\s\u2013\s","u");
function walk(d,o=[]){for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory())walk(p,o);else if(/\.(tsx?)$/.test(f)&&!/\.test\.|routeTree/.test(f))o.push(p);}return o;}
let n=0;
for(const p of walk("src")){
  const src=fs.readFileSync(p,"utf8");
  const sf=ts.createSourceFile(p,src,ts.ScriptTarget.Latest,true,p.endsWith("x")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  (function v(node){
    const k=node.kind;
    if(k===ts.SyntaxKind.StringLiteral||k===ts.SyntaxKind.NoSubstitutionTemplateLiteral||k===ts.SyntaxKind.TemplateHead||k===ts.SyntaxKind.TemplateMiddle||k===ts.SyntaxKind.TemplateTail||k===ts.SyntaxKind.JsxText){
      const t=node.getText(sf);
      if(re.test(t)){
        const {line}=sf.getLineAndCharacterOfPosition(node.getStart(sf));
        console.log(`${p}:${line+1}: ${t.replace(/\s+/g," ").trim().slice(0,170)}`);n++;
      }
    }
    ts.forEachChild(node,v);
  })(sf);
}
console.error("träffar",n);
