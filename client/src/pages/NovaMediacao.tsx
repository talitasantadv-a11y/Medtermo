import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Stepper } from "../components/common/Stepper";
import { Spinner } from "../components/common/Spinner";
import { aplicarMascaraCnj, cnjEstaCompleto, validarCnj } from "../utils/cnj";
import {
  buscarProcessoPorCnj,
  consultarCnj,
  DadosCnjDatajud,
  iniciarProcesso,
  listarUploads,
  salvarProcesso,
} from "../services/processoService";
import { listarModelos } from "../services/modeloService";
import {
  criarSessao,
  atualizarSessao,
  obterTermoMontado,
  baixarPdfSessao,
  baixarDocxSessao,
} from "../services/sessaoService";
import { urlDoLogo } from "../services/cejuscService";
import { mensagemErro } from "../services/api";
import { DadosExtraidosProcesso, Modelo, Processo, Sessao, UploadProcesso } from "../types";
import { BlocoRenderizado } from "../types/termo";
import { PdfDropzone } from "../components/PdfUpload/PdfDropzone";
import { RevisaoDados, ProcessoRevisado } from "../components/PdfUpload/RevisaoDados";
import { SessaoForm } from "../components/SessaoForm/SessaoForm";
import { ResultadoForm } from "../components/SessaoForm/ResultadoForm";
import { TermoPreview } from "../components/TermoPreview/TermoPreview";

export default function NovaMediacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [passo, setPasso] = useState(1);

  // Passo 1
  const [numeroCnj, setNumeroCnj] = useState(() => aplicarMascaraCnj(searchParams.get("cnj") || ""));
  const [verificando, setVerificando] = useState(false);
  const [processo, setProcesso] = useState<Processo | null>(null);

  // Passo 2
  const [uploads, setUploads] = useState<UploadProcesso[]>([]);
  const [dadosConsolidados, setDadosConsolidados] = useState<DadosExtraidosProcesso | null>(null);
  const [dadosCnj, setDadosCnj] = useState<DadosCnjDatajud | null>(null);
  const [buscandoCnj, setBuscandoCnj] = useState(false);
  const [revisao, setRevisao] = useState<{ dados: ProcessoRevisado; valido: boolean } | null>(null);
  const [salvandoProcesso, setSalvandoProcesso] = useState(false);

  // Passo 3 e 4
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [salvandoSessao, setSalvandoSessao] = useState(false);

  // Passo 5
  const [termo, setTermo] = useState<BlocoRenderizado[]>([]);
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [carregandoTermo, setCarregandoTermo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [gerandoDocx, setGerandoDocx] = useState(false);

  useEffect(() => {
    listarModelos(true).then(setModelos).catch((e) => toast.error(mensagemErro(e)));
  }, []);

  async function handleVerificarCnj() {
    if (!cnjEstaCompleto(numeroCnj)) {
      toast.error("Informe o número completo do processo.");
      return;
    }
    if (!validarCnj(numeroCnj)) {
      toast.error("Número CNJ inválido. Confira o dígito verificador.");
      return;
    }
    setVerificando(true);
    try {
      const { encontrado, processo: encontradoProcesso } = await buscarProcessoPorCnj(numeroCnj);
      if (encontrado && encontradoProcesso && encontradoProcesso.partes.length > 0) {
        // Processo com dados já confirmados (partes cadastradas) — pula direto para a sessão.
        setProcesso(encontradoProcesso);
        toast.success("Processo já cadastrado — dados carregados automaticamente.");
        setPasso(3);
      } else if (encontrado && encontradoProcesso) {
        // Processo iniciado antes mas ainda sem dados confirmados (rascunho) — volta para
        // o passo 2 para completar/revisar, recuperando uploads já enviados anteriormente.
        setProcesso(encontradoProcesso);
        await atualizarConsolidados(encontradoProcesso.id);
        setPasso(2);
      } else {
        const rascunho = await iniciarProcesso(numeroCnj);
        setProcesso(rascunho);
        setPasso(2);
      }
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setVerificando(false);
    }
  }

  async function atualizarConsolidados(processoId: number) {
    try {
      const { uploads: lista, dadosConsolidados: consolidados } = await listarUploads(processoId);
      setUploads(lista);
      setDadosConsolidados(consolidados);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  async function handleBuscarCnj() {
    if (!processo) return;
    setBuscandoCnj(true);
    try {
      const { encontrado, dados } = await consultarCnj(processo.numeroCnj);
      if (encontrado && dados) {
        setDadosCnj(dados);
        toast.success("Dados oficiais do CNJ carregados.");
      } else {
        toast.error(
          "Processo não encontrado no DataJud. Isso é comum em mediações pré-processuais ou processos " +
            "muito recentes (indexação do CNJ tem atraso) — envie o PDF ou preencha os dados manualmente.",
          { duration: 6000 }
        );
      }
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setBuscandoCnj(false);
    }
  }

  async function handleConfirmarProcesso() {
    if (!processo || !revisao) return;
    setSalvandoProcesso(true);
    try {
      const salvo = await salvarProcesso({
        numeroCnj: processo.numeroCnj,
        lotacao: revisao.dados.lotacao,
        comarca: revisao.dados.comarca,
        classeProcessual: revisao.dados.classeProcessual,
        assunto: revisao.dados.assunto,
        partes: revisao.dados.partes,
      });
      setProcesso(salvo);
      toast.success("Dados do processo confirmados.");
      setPasso(3);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvandoProcesso(false);
    }
  }

  async function handleCriarSessao(payload: {
    modeloId: number;
    dataSessao: string;
    horarioInicio: string;
    horarioEncerramento?: string;
    local?: string;
    modalidade: "presencial" | "virtual";
    plataformaVirtual?: string;
    presencas: Record<string, boolean>;
  }) {
    if (!processo) return;
    setSalvandoSessao(true);
    try {
      const nova = await criarSessao({ processoId: processo.id, ...payload });
      setSessao(nova);
      setPasso(4);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvandoSessao(false);
    }
  }

  async function handleAtualizarResultado(payload: Partial<Sessao>) {
    if (!sessao) return;
    setSalvandoSessao(true);
    try {
      const atualizada = await atualizarSessao(sessao.id, payload);
      setSessao(atualizada);
      setPasso(5);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvandoSessao(false);
    }
  }

  useEffect(() => {
    if (passo === 5 && sessao) {
      setCarregandoTermo(true);
      obterTermoMontado(sessao.id)
        .then(({ termo, camposObrigatoriosFaltantes }) => {
          setTermo(termo);
          setFaltantes(camposObrigatoriosFaltantes);
        })
        .catch((e) => toast.error(mensagemErro(e)))
        .finally(() => setCarregandoTermo(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, sessao]);

  async function handleGerarPdf() {
    if (!sessao || !processo) return;
    setGerandoPdf(true);
    try {
      await baixarPdfSessao(sessao.id, `termo-${processo.numeroCnj}.pdf`);
      toast.success("Termo gerado e salvo no histórico do processo.");
      navigate(`/processos/${processo.id}`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setGerandoPdf(false);
    }
  }

  async function handleGerarDocx() {
    if (!sessao || !processo) return;
    setGerandoDocx(true);
    try {
      await baixarDocxSessao(sessao.id, `termo-${processo.numeroCnj}.docx`);
      toast.success("Termo gerado em Word e salvo no histórico do processo.");
      navigate(`/processos/${processo.id}`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setGerandoDocx(false);
    }
  }

  const modeloDaSessao = modelos.find((m) => m.id === sessao?.modeloId);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Nova Mediação</h1>
      <p className="mb-6 text-sm text-neutral-500">Siga os passos para gerar o termo de sessão.</p>

      <Stepper passoAtual={passo} />

      <div className="card">
        {passo === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Número do processo (CNJ)</label>
              <input
                className="input font-mono"
                placeholder="NNNNNNN-DD.AAAA.J.TR.OOOO"
                value={numeroCnj}
                onChange={(e) => setNumeroCnj(aplicarMascaraCnj(e.target.value))}
                maxLength={25}
              />
            </div>
            <button className="btn-primary w-full" onClick={handleVerificarCnj} disabled={verificando}>
              {verificando && <Spinner />}
              Verificar processo
            </button>
          </div>
        )}

        {passo === 2 && processo && (
          <div className="space-y-6">
            <p className="text-sm text-neutral-500">
              Use qualquer combinação das opções abaixo — envie o PDF, busque no CNJ e complete ou
              corrija o que faltar manualmente. Nada aqui é excludente.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="card">
                <p className="font-medium text-neutral-800">📄 Upload de PDF</p>
                <p className="mt-1 mb-3 text-xs text-neutral-500">
                  Envie o PDF do processo exportado do PJe e deixe o sistema extrair os dados.
                </p>
                <PdfDropzone
                  processoId={processo.id}
                  uploads={uploads}
                  onUploadsAlterados={() => atualizarConsolidados(processo.id)}
                />
              </div>

              <div className="card flex flex-col">
                <p className="font-medium text-neutral-800">🔍 Buscar no CNJ (DataJud)</p>
                <p className="mt-1 mb-3 flex-1 text-xs text-neutral-500">
                  Puxa classe, assunto e órgão julgador direto da base oficial do CNJ (não substitui os
                  dados das partes, que vêm do PDF ou são preenchidos manualmente — por LGPD o DataJud
                  não retorna nome/CPF). Pode não encontrar mediações pré-processuais ou processos muito
                  recentes.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBuscarCnj}
                  disabled={buscandoCnj}
                >
                  {buscandoCnj && <Spinner />}
                  Buscar no CNJ (DataJud)
                </button>
              </div>
            </div>

            <hr className="border-neutral-100" />

            <div>
              <h3 className="mb-1 text-sm font-semibold text-neutral-700">Dados do processo</h3>
              <p className="mb-3 text-xs text-neutral-500">
                Revise o que foi extraído/preenchido acima e complete manualmente o que faltar.
              </p>
              <RevisaoDados
                dadosExtraidos={dadosConsolidados}
                dadosCnj={dadosCnj}
                onDadosValidados={(dados, valido) => setRevisao({ dados, valido })}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => setPasso(1)}>
                Voltar
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleConfirmarProcesso}
                disabled={!revisao?.valido || salvandoProcesso}
              >
                {salvandoProcesso && <Spinner />}
                Confirmar dados e continuar
              </button>
            </div>
          </div>
        )}

        {passo === 3 && processo && (
          <SessaoForm
            modelos={modelos}
            partes={processo.partes}
            carregando={salvandoSessao}
            onSubmit={handleCriarSessao}
          />
        )}

        {passo === 4 && sessao && modeloDaSessao && (
          <ResultadoForm
            modelo={modeloDaSessao}
            sessao={sessao}
            carregando={salvandoSessao}
            onSubmit={handleAtualizarResultado}
          />
        )}

        {passo === 5 && (
          <div className="space-y-5">
            {carregandoTermo ? (
              <div className="flex justify-center py-10 text-brand-700">
                <Spinner tamanho={28} />
              </div>
            ) : (
              <>
                {faltantes.length > 0 && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    Campos obrigatórios pendentes: {faltantes.join(", ")}. Volte à etapa anterior para preenchê-los.
                  </div>
                )}
                <TermoPreview
                  blocos={termo}
                  cejusc={
                    modeloDaSessao?.cejusc
                      ? {
                          nome: modeloDaSessao.cejusc.nome,
                          logoUrl: urlDoLogo(modeloDaSessao.cejusc),
                          endereco: modeloDaSessao.cejusc.endereco,
                          telefone: modeloDaSessao.cejusc.telefone,
                          email: modeloDaSessao.cejusc.email,
                        }
                      : null
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <button className="btn-secondary" onClick={() => setPasso(4)}>
                    Voltar
                  </button>
                  <button
                    className="btn-secondary flex-1"
                    onClick={handleGerarDocx}
                    disabled={gerandoDocx || faltantes.length > 0}
                  >
                    {gerandoDocx && <Spinner />}
                    📝 Baixar em Word
                  </button>
                  <button
                    className="btn-primary flex-1"
                    onClick={handleGerarPdf}
                    disabled={gerandoPdf || faltantes.length > 0}
                  >
                    {gerandoPdf && <Spinner />}
                    Gerar PDF e finalizar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
