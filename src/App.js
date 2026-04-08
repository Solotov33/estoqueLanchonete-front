import { useState, useEffect, useCallback } from "react";

//const backend = import.meta.env.VITE_BACKEND;
const backend = process.env.REACT_APP_BACKEND;
const API = `${backend}`;

const TABS = [
  { id: "todos",    label: "Todos"          },
  { id: "proximos", label: "Proximos"       },
  { id: "vencidos", label: "Vencidos"       },
];

const STATUS = {
  vencido:  { label: "Vencido",         cor: "#e24b4a", bg: "#fcebeb" },
  urgente:  { label: "Vence hoje/amanha",cor: "#ba7517", bg: "#faeeda" },
  alerta:   { label: "Vence em breve",  cor: "#3b6d11", bg: "#eaf3de" },
  ok:       { label: "OK",              cor: "#185fa5", bg: "#e6f1fb" },
};

function getStatus(validade) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const val  = new Date(validade + "T00:00:00");
  const diff = Math.ceil((val - hoje) / 86400000);
  if (diff < 0)  return { ...STATUS.vencido,  diff };
  if (diff <= 1) return { ...STATUS.urgente,  diff };
  if (diff <= 7) return { ...STATUS.alerta,   diff };
  return { ...STATUS.ok, diff };
}

function Badge({ validade }) {
  const s = getStatus(validade);
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 99, background: s.bg, color: s.cor,
      letterSpacing: ".3px", whiteSpace: "nowrap"
    }}>
      {s.diff < 0
        ? `Venceu ha ${Math.abs(s.diff)}d`
        : s.diff === 0 ? "Vence hoje"
        : s.diff === 1 ? "Vence amanha"
        : `${s.diff} dias`}
    </span>
  );
}

function Modal({ produto, onClose, onSalvar }) {
  const vazio = { nome: "", quantidade: "", validade: "" };
  const [form, setForm] = useState(produto || vazio);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.nome.trim()) return setErro('Preencha o nome.');
    if (form.quantidade === "" || Number(form.quantidade) < 0) return setErro('Quantidade invalida.');
    if (!form.validade) return setErro('Preencha a validade.');
    setErro(""); setLoading(true);
    try {
      const url = produto ? `${API}/${produto.id}` : API;
      const method = produto ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantidade: Number(form.quantidade) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.erros?.[0] || d.erro); }
      await onSalvar();
      onClose();
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.45)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:100
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff",borderRadius:16,padding:32,width:"100%",maxWidth:420,
        boxShadow:"0 8px 40px rgba(0,0,0,.18)"
      }}>
        <h2 style={{margin:"0 0 24px",fontSize:18,fontWeight:700,color:"#1a1a2e"}}>
          {produto ? "Editar produto" : "Novo produto"}
        </h2>

        {["nome","quantidade","validade"].map(k => (
          <div key={k} style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#666",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>
              {k === "nome" ? "Nome" : k === "quantidade" ? "Quantidade" : "Validade"}
            </label>
            <input
              type={k==="quantidade"?"number":k==="validade"?"date":"text"}
              value={form[k]}
              min={k==="quantidade"?0:undefined}
              onChange={e=>set(k,e.target.value)}
              style={{
                width:"100%",padding:"10px 12px",border:"1.5px solid #e0e0e0",
                borderRadius:8,fontSize:15,outline:"none",boxSizing:"border-box",
                fontFamily:"inherit"
              }}
            />
          </div>
        ))}

        {erro && <p style={{color:"#e24b4a",fontSize:13,margin:"0 0 12px"}}>{erro}</p>}

        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onClose} style={{
            flex:1,padding:"10px 0",border:"1.5px solid #e0e0e0",borderRadius:8,
            background:"#f5f5f5",cursor:"pointer",fontSize:14,fontWeight:600
          }}>Cancelar</button>
          <button onClick={salvar} disabled={loading} style={{
            flex:1,padding:"10px 0",border:"none",borderRadius:8,
            background:"#1a1a2e",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600
          }}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ produto, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  async function confirmar() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.45)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:100
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff",borderRadius:16,padding:32,width:"100%",maxWidth:360,
        boxShadow:"0 8px 40px rgba(0,0,0,.18)"
      }}>
        <h2 style={{margin:"0 0 8px",fontSize:17,fontWeight:700,color:"#1a1a2e"}}>Deletar produto?</h2>
        <p style={{margin:"0 0 24px",color:"#666",fontSize:14}}>
          "<strong>{produto.nome}</strong>" sera removido permanentemente.
        </p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{
            flex:1,padding:"10px 0",border:"1.5px solid #e0e0e0",borderRadius:8,
            background:"#f5f5f5",cursor:"pointer",fontSize:14,fontWeight:600
          }}>Cancelar</button>
          <button onClick={confirmar} disabled={loading} style={{
            flex:1,padding:"10px 0",border:"none",borderRadius:8,
            background:"#e24b4a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600
          }}>
            {loading ? "Deletando..." : "Deletar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [aba,        setAba]        = useState("todos");
  const [produtos,   setProdutos]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [erro,       setErro]       = useState("");
  const [busca,      setBusca]      = useState("");
  const [modal,      setModal]      = useState(null); // null | "novo" | produto
  const [deletando,  setDeletando]  = useState(null);
  const [dias,       setDias]       = useState(7);

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    try {
const url = 
  aba === "proximos" ? `${API}/produtos/validade/proximos?dias=${dias}` :
  aba === "vencidos" ? `${API}/produtos/validade/vencidos` :
  `${API}/produtos`;
      const res  = await fetch(url);
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : data.produtos || []);
    } catch {
      setErro("Nao foi possivel conectar a API. Verifique se o backend esta rodando em localhost:3000");
    }
    setLoading(false);
  }, [aba, dias]);

  useEffect(() => { carregar(); }, [carregar]);

  async function deletar(p) {
    await fetch(`${API}/produtos/${p.id}`, { method: "DELETE" });
    setDeletando(null);
    carregar();
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const stats = {
    total:    produtos.length,
    vencidos: produtos.filter(p => getStatus(p.validade).diff < 0).length,
    alerta:   produtos.filter(p => { const d = getStatus(p.validade).diff; return d >= 0 && d <= 7; }).length,
    ok:       produtos.filter(p => getStatus(p.validade).diff > 7).length,
  };

  return (
    <div style={{minHeight:"100vh",background:"#f4f4f6",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* Header */}
      <div style={{background:"#1a1a2e",padding:"0 32px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,background:"#f5a623",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
              🥪
            </div>
            <span style={{color:"#fff",fontWeight:700,fontSize:17,letterSpacing:"-.3px"}}>
              Estoque Lanchonete
            </span>
          </div>
          <button onClick={()=>setModal("novo")} style={{
            background:"#f5a623",border:"none",borderRadius:8,padding:"8px 18px",
            fontWeight:700,fontSize:14,cursor:"pointer",color:"#1a1a2e"
          }}>
            + Novo produto
          </button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px"}}>

        {/* Cards de resumo — mostra na aba "todos" */}
        {aba === "todos" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
            {[
              { label:"Total",   valor: stats.total,   cor:"#185fa5", bg:"#e6f1fb" },
              { label:"OK",      valor: stats.ok,      cor:"#3b6d11", bg:"#eaf3de" },
              { label:"Alerta",  valor: stats.alerta,  cor:"#ba7517", bg:"#faeeda" },
              { label:"Vencidos",valor: stats.vencidos,cor:"#a32d2d", bg:"#fcebeb" },
            ].map(c => (
              <div key={c.label} style={{background:c.bg,borderRadius:12,padding:"14px 18px"}}>
                <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:c.cor,textTransform:"uppercase",letterSpacing:".5px"}}>{c.label}</p>
                <p style={{margin:0,fontSize:26,fontWeight:700,color:c.cor}}>{c.valor}</p>
              </div>
            ))}
          </div>
        )}

        {/* Abas */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:"#e8e8ec",borderRadius:10,padding:4,width:"fit-content"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setAba(t.id)} style={{
              padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:600,transition:"all .15s",
              background: aba===t.id ? "#fff" : "transparent",
              color:       aba===t.id ? "#1a1a2e" : "#888",
              boxShadow:   aba===t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Filtro de dias (so na aba proximos) */}
        {aba === "proximos" && (
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <span style={{fontSize:13,color:"#666"}}>Vencendo em ate</span>
            {[3,7,14,30].map(d => (
              <button key={d} onClick={()=>setDias(d)} style={{
                padding:"5px 14px",borderRadius:20,border:"1.5px solid",cursor:"pointer",
                fontSize:13,fontWeight:600,
                borderColor: dias===d ? "#1a1a2e" : "#ddd",
                background:  dias===d ? "#1a1a2e" : "#fff",
                color:       dias===d ? "#fff" : "#666",
              }}>{d}d</button>
            ))}
          </div>
        )}

        {/* Busca */}
        <input
          placeholder="Buscar produto..."
          value={busca}
          onChange={e=>setBusca(e.target.value)}
          style={{
            width:"100%",padding:"10px 14px",border:"1.5px solid #e0e0e0",
            borderRadius:10,fontSize:14,marginBottom:16,boxSizing:"border-box",
            fontFamily:"inherit",background:"#fff",outline:"none"
          }}
        />

        {/* Erros / loading */}
        {erro && (
          <div style={{background:"#fcebeb",border:"1.5px solid #f09595",borderRadius:10,padding:"14px 18px",marginBottom:16,color:"#a32d2d",fontSize:14}}>
            {erro}
          </div>
        )}
        {loading && (
          <div style={{textAlign:"center",padding:40,color:"#999",fontSize:14}}>Carregando...</div>
        )}

        {/* Lista de produtos */}
        {!loading && !erro && (
          filtrados.length === 0
            ? <div style={{textAlign:"center",padding:60,color:"#bbb",fontSize:15}}>Nenhum produto encontrado.</div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filtrados.map(p => {
                  const s = getStatus(p.validade);
                  return (
                    <div key={p.id} style={{
                      background:"#fff",borderRadius:12,padding:"14px 18px",
                      display:"flex",alignItems:"center",gap:16,
                      border:"1.5px solid #ececec",
                    }}>
                      {/* Indicador de cor lateral */}
                      <div style={{width:4,height:44,borderRadius:2,background:s.cor,flexShrink:0}} />

                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:15,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {p.nome}
                          </span>
                          <Badge validade={p.validade} />
                        </div>
                        <div style={{display:"flex",gap:16}}>
                          <span style={{fontSize:12,color:"#888"}}>
                            Qtd: <strong style={{color:"#1a1a2e"}}>{p.quantidade}</strong>
                          </span>
                          <span style={{fontSize:12,color:"#888"}}>
                            Val: <strong style={{color:"#1a1a2e"}}>{p.validade}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Acoes */}
                      <div style={{display:"flex",gap:8,flexShrink:0}}>
                        <button onClick={()=>setModal(p)} style={{
                          padding:"6px 14px",borderRadius:7,border:"1.5px solid #ddd",
                          background:"#f9f9f9",cursor:"pointer",fontSize:13,fontWeight:600,color:"#444"
                        }}>Editar</button>
                        <button onClick={()=>setDeletando(p)} style={{
                          padding:"6px 14px",borderRadius:7,border:"1.5px solid #f09595",
                          background:"#fcebeb",cursor:"pointer",fontSize:13,fontWeight:600,color:"#a32d2d"
                        }}>Deletar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
        )}
      </div>

      {/* Modais */}
      {modal && (
        <Modal
          produto={modal === "novo" ? null : modal}
          onClose={()=>setModal(null)}
          onSalvar={carregar}
        />
      )}
      {deletando && (
        <ConfirmDelete
          produto={deletando}
          onClose={()=>setDeletando(null)}
          onConfirm={()=>deletar(deletando)}
        />
      )}
    </div>
  );
}

