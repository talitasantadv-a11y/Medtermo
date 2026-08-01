import { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Cejusc } from "../types";
import {
  atualizarCejusc,
  criarCejusc,
  enviarLogoCejusc,
  listarCejuscs,
  removerCejusc,
  removerLogoCejusc,
  urlDoLogo,
} from "../services/cejuscService";
import { mensagemErro } from "../services/api";
import { Spinner } from "../components/common/Spinner";

interface FormState {
  id?: number;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
}

const FORM_VAZIO: FormState = { nome: "", endereco: "", telefone: "", email: "" };

export default function Cejuscs() {
  const [cejuscs, setCejuscs] = useState<Cejusc[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState<number | null>(null);
  const inputLogoRef = useRef<HTMLInputElement>(null);
  const logoAlvoRef = useRef<number | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setCejuscs(await listarCejuscs());
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        endereco: form.endereco || undefined,
        telefone: form.telefone || undefined,
        email: form.email || undefined,
      };
      if (form.id) {
        await atualizarCejusc(form.id, payload);
        toast.success("CEJUSC atualizado.");
      } else {
        await criarCejusc(payload);
        toast.success("CEJUSC cadastrado.");
      }
      setForm(null);
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(cejusc: Cejusc) {
    if (!confirm(`Remover "${cejusc.nome}"? Modelos vinculados ficarão sem CEJUSC.`)) return;
    try {
      await removerCejusc(cejusc.id);
      toast.success("CEJUSC removido.");
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  function abrirSeletorDeLogo(id: number) {
    logoAlvoRef.current = id;
    inputLogoRef.current?.click();
  }

  async function handleArquivoLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    const id = logoAlvoRef.current;
    e.target.value = "";
    if (!arquivo || !id) return;
    setEnviandoLogo(id);
    try {
      await enviarLogoCejusc(id, arquivo);
      toast.success("Logomarca atualizada.");
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setEnviandoLogo(null);
    }
  }

  async function handleRemoverLogo(id: number) {
    try {
      await removerLogoCejusc(id);
      toast.success("Logomarca removida.");
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  return (
    <div>
      <input ref={inputLogoRef} type="file" accept="image/*" className="hidden" onChange={handleArquivoLogo} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">CEJUSCs</h1>
          <p className="text-sm text-neutral-500">
            Cadastre os CEJUSCs/varas onde você atua — a logomarca e o rodapé (endereço, telefone,
            e-mail) de cada um aparecem nos termos gerados pelos modelos vinculados a eles.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setForm(FORM_VAZIO)}>
          + Novo CEJUSC
        </button>
      </div>

      {form && (
        <form onSubmit={handleSalvar} className="card mb-6 space-y-4">
          <h2 className="font-medium text-neutral-800">
            {form.id ? "Editar CEJUSC" : "Novo CEJUSC"}
          </h2>
          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: CEJUSC Central - São Paulo"
              required
            />
          </div>
          <div>
            <label className="label">Endereço completo</label>
            <input
              className="input"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade/UF"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={salvando}>
              {salvando && <Spinner />}
              Salvar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner tamanho={28} />
        </div>
      ) : cejuscs.length === 0 ? (
        <p className="card text-center text-sm text-neutral-500">Nenhum CEJUSC cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cejuscs.map((c) => {
            const logoUrl = urlDoLogo(c);
            return (
              <div key={c.id} className="card">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {logoUrl ? (
                      <img src={logoUrl} alt={`Logo ${c.nome}`} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-neutral-400">sem logo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-800">{c.nome}</p>
                    {c.endereco && <p className="truncate text-xs text-neutral-500">{c.endereco}</p>}
                    <p className="text-xs text-neutral-400">
                      {[c.telefone, c.email].filter(Boolean).join(" — ") || "Sem contato cadastrado"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary !px-2.5 !py-1.5 text-xs"
                    onClick={() => abrirSeletorDeLogo(c.id)}
                    disabled={enviandoLogo === c.id}
                  >
                    {enviandoLogo === c.id && <Spinner />}
                    {logoUrl ? "Trocar logo" : "Enviar logo"}
                  </button>
                  {logoUrl && (
                    <button
                      className="btn-secondary !px-2.5 !py-1.5 text-xs"
                      onClick={() => handleRemoverLogo(c.id)}
                    >
                      Remover logo
                    </button>
                  )}
                  <button
                    className="btn-secondary !px-2.5 !py-1.5 text-xs"
                    onClick={() =>
                      setForm({
                        id: c.id,
                        nome: c.nome,
                        endereco: c.endereco || "",
                        telefone: c.telefone || "",
                        email: c.email || "",
                      })
                    }
                  >
                    Editar
                  </button>
                  <button className="btn-danger !px-2.5 !py-1.5 text-xs" onClick={() => handleRemover(c)}>
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
