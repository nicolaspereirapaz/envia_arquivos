"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type InputHTMLAttributes,
  type SetStateAction,
} from "react";
import {
  PEDIDO_STATUS_OPTIONS,
  PRAZO_OPTIONS,
  createCliente,
  createPedido,
  getDefaultApiBaseUrl,
  getPedidoDetalhado,
  getWhatsappResumo,
  listClientes,
  listNotificacoes,
  listPedidos,
  marcarNotificacaoComoLida,
  updatePedidoStatus,
  uploadArquivos,
  type Cliente,
  type Notificacao,
  type PedidoDetalhado,
  type PedidoResumo,
  type PedidoStatus,
  type PrazoPedido,
  type UploadedArquivo,
  type WhatsappResumoPedido,
} from "@/lib/fare-foto-api";
import type { NotificacoesStreamPayload } from "@/lib/fare-foto-api";

type PedidoStatusFiltro = PedidoStatus | "todos";

interface FluxoResultado {
  cliente: Cliente;
  pedido: PedidoDetalhado;
  whatsapp: WhatsappResumoPedido;
  uploads: {
    photos: UploadedArquivo[];
    documents: UploadedArquivo[];
  };
}

interface DashboardData {
  clientes: Cliente[];
  pedidos: PedidoResumo[];
  notificacoes: Notificacao[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PEDIDO_STATUS_FILTER_OPTIONS: Array<{
  value: PedidoStatusFiltro;
  label: string;
}> = [
  {
    value: "todos",
    label: "Todos os status",
  },
  ...PEDIDO_STATUS_OPTIONS,
];

export default function Home() {
  const [apiBaseUrl, setApiBaseUrl] = useState(getDefaultApiBaseUrl());
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [prazo, setPrazo] = useState<PrazoPedido>("uma_hora");
  const [photoSize, setPhotoSize] = useState("10x15");
  const [photoQuantity, setPhotoQuantity] = useState("1");
  const [documentQuantity, setDocumentQuantity] = useState("1");
  const [documentColorido, setDocumentColorido] = useState(false);
  const [tipoImpressao, setTipoImpressao] = useState("simples");
  const [acabamento, setAcabamento] = useState("sem acabamento");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [pedidoSearch, setPedidoSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PedidoStatusFiltro>("todos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingPedidoDetalhado, setIsLoadingPedidoDetalhado] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [pedidoDetalheError, setPedidoDetalheError] = useState<string | null>(
    null,
  );
  const [activity, setActivity] = useState<string[]>([
    "Painel pronto. Preencha os dados do cliente e envie os arquivos do pedido.",
  ]);
  const [resultado, setResultado] = useState<FluxoResultado | null>(null);
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<string | null>(
    null,
  );
  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<PedidoDetalhado | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>({
    clientes: [],
    pedidos: [],
    notificacoes: [],
  });

  const deferredPedidoSearch = useDeferredValue(pedidoSearch);
  const totalArquivos = photoFiles.length + documentFiles.length;
  const pedidosOrdenados = [...dashboard.pedidos].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const pedidosFiltrados = pedidosOrdenados.filter((pedido) => {
    const statusMatches =
      statusFilter === "todos" || pedido.status === statusFilter;
    const searchTerm = deferredPedidoSearch.trim().toLowerCase();

    if (!statusMatches) {
      return false;
    }

    if (searchTerm.length === 0) {
      return true;
    }

    const clienteNome = resolverNomeCliente(dashboard.clientes, pedido.clienteId);

    return [pedido.id, clienteNome, pedido.observacoes ?? "", formatStatus(pedido.status)]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);
  });
  const notificacoesOrdenadas = [...dashboard.notificacoes].sort((a, b) =>
    b.criadaEm.localeCompare(a.criadaEm),
  );
  const notificacoesPendentes = dashboard.notificacoes.filter(
    (item) => !item.lida,
  ).length;
  const clienteSelecionado = pedidoSelecionado
    ? dashboard.clientes.find(
        (cliente) => cliente.id === pedidoSelecionado.clienteId,
      ) ?? null
    : null;
  const pedidoSelecionadoResumo = pedidoSelecionadoId
    ? dashboard.pedidos.find((pedido) => pedido.id === pedidoSelecionadoId) ?? null
    : null;

  useEffect(() => {
    void carregarDashboard("Dashboard sincronizado com a API.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      return;
    }

    const eventSource = new EventSource(
      `${apiBaseUrl.replace(/\/+$/, "")}/notificacoes/stream`,
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificacoesStreamPayload;

        setDashboard((current) => ({
          ...current,
          notificacoes: payload.notificacoes,
        }));

        if (payload.reason === "criada") {
          adicionarAtividade(
            "Nova notificacao recebida em tempo real. Sincronizando pedidos.",
          );
          void carregarDashboard();
        }
      } catch {
        setDashboardError(
          "Nao foi possivel interpretar a atualizacao em tempo real.",
        );
      }
    };

    eventSource.onerror = () => {
      setDashboardError(
        "Conexao em tempo real indisponivel no momento. O painel continua com sincronizacao manual.",
      );
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  async function carregarDashboard(successMessage?: string) {
    setIsLoadingDashboard(true);
    setDashboardError(null);

    try {
      const [clientes, pedidos, notificacoes] = await Promise.all([
        listClientes(apiBaseUrl),
        listPedidos(apiBaseUrl),
        listNotificacoes(apiBaseUrl),
      ]);

      setDashboard({
        clientes,
        pedidos,
        notificacoes,
      });

      await sincronizarPedidoSelecionado(pedidos);

      if (successMessage) {
        adicionarAtividade(successMessage);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar pedidos e notificacoes.";

      setDashboardError(message);
      adicionarAtividade(`Falha ao sincronizar o painel: ${message}`);
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  async function sincronizarPedidoSelecionado(pedidos: PedidoResumo[]) {
    const proximoPedidoId = resolverProximoPedidoSelecionadoId(
      pedidos,
      pedidoSelecionadoId,
    );

    if (!proximoPedidoId) {
      setPedidoSelecionadoId(null);
      setPedidoSelecionado(null);
      setPedidoDetalheError(null);
      return;
    }

    await carregarPedidoDetalhado(proximoPedidoId, {
      silenciarAtividade: true,
    });
  }

  async function carregarPedidoDetalhado(
    pedidoId: string,
    options?: {
      silenciarAtividade?: boolean;
      activityMessage?: string;
    },
  ) {
    setPedidoSelecionadoId(pedidoId);
    setIsLoadingPedidoDetalhado(true);
    setPedidoDetalheError(null);

    try {
      const pedido = await getPedidoDetalhado(apiBaseUrl, pedidoId);
      setPedidoSelecionado(pedido);

      if (!options?.silenciarAtividade) {
        adicionarAtividade(
          options?.activityMessage ??
            `Detalhes do pedido ${pedido.id} carregados no painel.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os detalhes do pedido.";

      setPedidoDetalheError(message);
      adicionarAtividade(`Falha ao abrir o pedido ${pedidoId}: ${message}`);
    } finally {
      setIsLoadingPedidoDetalhado(false);
    }
  }

  function atualizarArquivos(
    setter: Dispatch<SetStateAction<File[]>>,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setter(Array.from(event.target.files ?? []));
  }

  function adicionarAtividade(message: string) {
    setActivity((current) => [...current, message]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nome.trim().length === 0 || telefone.trim().length === 0) {
      setErrorMessage("Preencha nome e telefone antes de criar o pedido.");
      return;
    }

    if (totalArquivos === 0) {
      setErrorMessage("Selecione ao menos um arquivo de foto ou documento.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResultado(null);
    setActivity([
      "Fluxo iniciado. Validando a conexao com a API e preparando os arquivos.",
    ]);

    try {
      const parsedPhotoQuantity =
        photoFiles.length > 0
          ? parsePositiveInteger(photoQuantity, "quantidade das fotos")
          : undefined;
      const parsedDocumentQuantity =
        documentFiles.length > 0
          ? parsePositiveInteger(documentQuantity, "quantidade dos documentos")
          : undefined;

      adicionarAtividade("Enviando arquivos de foto e documento.");

      const [uploadedPhotos, uploadedDocuments] = await Promise.all([
        uploadArquivos(apiBaseUrl, "photos", photoFiles),
        uploadArquivos(apiBaseUrl, "documents", documentFiles),
      ]);

      adicionarAtividade(
        `${uploadedPhotos.length} foto(s) e ${uploadedDocuments.length} documento(s) enviados.`,
      );

      const cliente = await createCliente(apiBaseUrl, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        observacoes: normalizeOptionalText(observacoes),
      });

      adicionarAtividade(`Cliente ${cliente.nome} criado com id ${cliente.id}.`);

      const fotosPayload =
        uploadedPhotos.length > 0 && parsedPhotoQuantity
          ? uploadedPhotos.map((file) => ({
              arquivoUrl: file.url,
              tamanho: photoSize,
              quantidade: parsedPhotoQuantity,
            }))
          : undefined;
      const documentosPayload =
        uploadedDocuments.length > 0 && parsedDocumentQuantity
          ? uploadedDocuments.map((file) => ({
              arquivoUrl: file.url,
              quantidade: parsedDocumentQuantity,
              colorido: documentColorido,
              tipoImpressao: normalizeOptionalText(tipoImpressao),
              acabamento: normalizeOptionalText(acabamento),
            }))
          : undefined;

      const pedido = await createPedido(apiBaseUrl, {
        clienteId: cliente.id,
        prazo,
        observacoes: normalizeOptionalText(observacoes),
        fotos: fotosPayload,
        documentos: documentosPayload,
      });

      adicionarAtividade(
        `Pedido ${pedido.id} criado com total ${currencyFormatter.format(pedido.total)}.`,
      );

      const whatsapp = await getWhatsappResumo(apiBaseUrl, pedido.id);

      adicionarAtividade("Resumo de WhatsApp gerado e pronto para abrir.");

      setResultado({
        cliente,
        pedido,
        whatsapp,
        uploads: {
          photos: uploadedPhotos,
          documents: uploadedDocuments,
        },
      });
      setPedidoSelecionadoId(pedido.id);
      setPedidoSelecionado(pedido);
      setPedidoDetalheError(null);
      setPedidoSearch("");
      setStatusFilter("todos");

      await carregarDashboard(
        `Fila atualizada apos o novo pedido ${pedido.id}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir o fluxo.";

      setErrorMessage(message);
      adicionarAtividade(`Falha ao processar o pedido: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(
    pedidoId: string,
    status: PedidoStatus,
  ) {
    try {
      await updatePedidoStatus(apiBaseUrl, pedidoId, status);
      adicionarAtividade(`Status do pedido ${pedidoId} atualizado para ${status}.`);
      await carregarDashboard("Pedidos e notificacoes atualizados.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o status do pedido.";

      setDashboardError(message);
      adicionarAtividade(`Falha ao atualizar pedido ${pedidoId}: ${message}`);
    }
  }

  async function handleMarcarNotificacaoComoLida(notificacaoId: string) {
    try {
      await marcarNotificacaoComoLida(apiBaseUrl, notificacaoId);
      adicionarAtividade(`Notificacao ${notificacaoId} marcada como lida.`);
      await carregarDashboard("Notificacoes sincronizadas com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel marcar a notificacao como lida.";

      setDashboardError(message);
      adicionarAtividade(
        `Falha ao atualizar notificacao ${notificacaoId}: ${message}`,
      );
    }
  }

  async function handleAbrirPedido(pedidoId: string, source: string) {
    await carregarPedidoDetalhado(pedidoId, {
      activityMessage: source,
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
      <section className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-6 py-8 shadow-[var(--shadow-soft)] backdrop-blur md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
              Fare Foto Admin
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-5xl">
              Upload real, criacao de cliente, fila de pedidos e atendimento no mesmo painel.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)] sm:text-base">
              O painel agora cobre o fluxo operacional e o acompanhamento do que
              entrou: cria o pedido, atualiza a fila, mostra notificacoes,
              filtra a demanda e abre o detalhe completo do pedido sem sair da
              tela.
            </p>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-5 text-sm text-[color:var(--color-muted)] sm:grid-cols-4 lg:min-w-[34rem]">
            <ResumoNumero label="Arquivos prontos" value={String(totalArquivos)} />
            <ResumoNumero
              label="Pedidos no painel"
              value={String(dashboard.pedidos.length)}
            />
            <ResumoNumero
              label="Notificacoes"
              value={String(dashboard.notificacoes.length)}
            />
            <ResumoNumero
              label="Pendencias"
              value={String(notificacoesPendentes)}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8"
        >
          <div className="grid gap-8">
            <section className="grid gap-4">
              <CabecalhoSecao
                eyebrow="Conexao"
                title="URL da API"
                description="O admin roda em http://localhost:3001 e consome a API real em http://localhost:3000 por padrao."
              />
              <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                Endpoint base
                <input
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  type="url"
                  className="rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-4 focus:ring-[color:var(--color-accent-soft)]"
                  placeholder="http://localhost:3000"
                />
              </label>
            </section>

            <section className="grid gap-4">
              <CabecalhoSecao
                eyebrow="Cliente"
                title="Cadastro rapido"
                description="Este passo cria o cliente antes do pedido, usando a mesma API do backend."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Nome"
                  value={nome}
                  onChange={setNome}
                  placeholder="Joao da Silva"
                />
                <CampoTexto
                  label="Telefone"
                  value={telefone}
                  onChange={setTelefone}
                  placeholder="11999999999"
                />
              </div>
              <CampoTexto
                label="Observacoes"
                value={observacoes}
                onChange={setObservacoes}
                placeholder="Cliente pediu acabamento fosco e revisao de cor."
              />
            </section>

            <section className="grid gap-4">
              <CabecalhoSecao
                eyebrow="Prazo"
                title="Prazo do pedido"
                description="A mesma opcao escolhida aqui segue para a simulacao interna do backend e para o total final."
              />
              <div className="grid gap-3 md:grid-cols-3">
                {PRAZO_OPTIONS.map((option) => {
                  const ativo = prazo === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPrazo(option.value)}
                      className={`rounded-[24px] border px-4 py-4 text-left transition ${
                        ativo
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white shadow-[0_18px_40px_rgba(9,112,96,0.24)]"
                          : "border-[color:var(--color-line)] bg-white/70 text-[color:var(--foreground)] hover:border-[color:var(--color-accent)]"
                      }`}
                    >
                      <p className="text-base font-semibold">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          ativo
                            ? "text-white/80"
                            : "text-[color:var(--color-muted)]"
                        }`}
                      >
                        {option.helper}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4">
              <CabecalhoSecao
                eyebrow="Fotos"
                title="Upload e configuracao das fotos"
                description="Todas as fotos selecionadas usam o mesmo tamanho e quantidade nesta primeira versao do painel."
              />
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                  Arquivos de foto
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => atualizarArquivos(setPhotoFiles, event)}
                    className="rounded-2xl border border-dashed border-[color:var(--color-line)] bg-white/70 px-4 py-4 text-sm text-[color:var(--color-muted)]"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoTexto
                    label="Tamanho"
                    value={photoSize}
                    onChange={setPhotoSize}
                    placeholder="10x15"
                  />
                  <CampoTexto
                    label="Quantidade por arquivo"
                    value={photoQuantity}
                    onChange={setPhotoQuantity}
                    placeholder="1"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <ListaArquivos
                title="Fotos selecionadas"
                emptyMessage="Nenhuma foto adicionada ainda."
                files={photoFiles}
              />
            </section>

            <section className="grid gap-4">
              <CabecalhoSecao
                eyebrow="Documentos"
                title="Upload e configuracao dos documentos"
                description="Os documentos selecionados compartilham quantidade, tipo de impressao e acabamento nesta iteracao."
              />
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                  Arquivos de documento
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,image/*"
                    onChange={(event) =>
                      atualizarArquivos(setDocumentFiles, event)
                    }
                    className="rounded-2xl border border-dashed border-[color:var(--color-line)] bg-white/70 px-4 py-4 text-sm text-[color:var(--color-muted)]"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <CampoTexto
                    label="Quantidade por arquivo"
                    value={documentQuantity}
                    onChange={setDocumentQuantity}
                    placeholder="1"
                    inputMode="numeric"
                  />
                  <CampoTexto
                    label="Tipo de impressao"
                    value={tipoImpressao}
                    onChange={setTipoImpressao}
                    placeholder="simples"
                  />
                  <CampoTexto
                    label="Acabamento"
                    value={acabamento}
                    onChange={setAcabamento}
                    placeholder="sem acabamento"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-white/75 px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={documentColorido}
                    onChange={(event) => setDocumentColorido(event.target.checked)}
                    className="h-4 w-4 rounded border-[color:var(--color-line)] text-[color:var(--color-accent)]"
                  />
                  Documento colorido
                </label>
              </div>
              <ListaArquivos
                title="Documentos selecionados"
                emptyMessage="Nenhum documento adicionado ainda."
                files={documentFiles}
              />
            </section>

            <div className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--color-line)] bg-[linear-gradient(135deg,rgba(9,112,96,0.09),rgba(210,118,62,0.08))] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                  Acao
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                  Criar pedido completo
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  O painel envia os uploads, cria o cliente, monta o pedido com
                  as URLs retornadas, gera o resumo do WhatsApp e recarrega a
                  fila operacional.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Processando pedido..." : "Executar fluxo agora"}
              </button>
            </div>
          </div>
        </form>

        <aside className="grid gap-6">
          <section className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <CabecalhoSecao
                eyebrow="Automacao"
                title="Linha do tempo do fluxo"
                description="Cada etapa abaixo representa uma chamada real feita para a API."
              />
              <button
                type="button"
                onClick={() =>
                  void carregarDashboard("Dashboard sincronizado manualmente.")
                }
                disabled={isLoadingDashboard}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white/75 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--color-accent)] disabled:opacity-60"
              >
                {isLoadingDashboard ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>

            <ol className="mt-4 grid gap-3">
              {activity.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="rounded-2xl border border-[color:var(--color-line)] bg-white/70 px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]"
                >
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)] text-xs font-semibold text-[color:var(--color-accent)]">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>

            {errorMessage ? (
              <FeedbackBox tone="error" className="mt-4">
                {errorMessage}
              </FeedbackBox>
            ) : null}

            {dashboardError ? (
              <FeedbackBox tone="warning" className="mt-4">
                {dashboardError}
              </FeedbackBox>
            ) : null}
          </section>

          <section className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <CabecalhoSecao
              eyebrow="Ultimo resultado"
              title="Retorno do backend"
              description="Depois de um envio bem-sucedido, o painel mostra os ids gerados e o atalho para o WhatsApp."
            />

            {resultado ? (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 rounded-[24px] border border-[color:var(--color-line)] bg-white/75 p-4">
                  <ResumoLinha label="Cliente" value={resultado.cliente.nome} />
                  <ResumoLinha label="Pedido" value={resultado.pedido.id} />
                  <ResumoLinha
                    label="Status"
                    value={formatStatus(resultado.pedido.status)}
                  />
                  <ResumoLinha
                    label="Total"
                    value={currencyFormatter.format(resultado.pedido.total)}
                  />
                </div>

                <div className="grid gap-3 rounded-[24px] border border-[color:var(--color-line)] bg-white/75 p-4">
                  <ResumoLinha
                    label="Uploads de foto"
                    value={String(resultado.uploads.photos.length)}
                  />
                  <ResumoLinha
                    label="Uploads de documento"
                    value={String(resultado.uploads.documents.length)}
                  />
                </div>

                <a
                  href={resultado.whatsapp.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-accent-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Abrir resumo no WhatsApp
                </a>

                <div className="rounded-[24px] border border-[color:var(--color-line)] bg-[#112725] px-4 py-4 text-sm leading-6 text-[#d5ece5]">
                  {resultado.whatsapp.mensagem}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-[color:var(--color-line)] bg-white/55 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
                O retorno completo do pedido vai aparecer aqui assim que o fluxo terminar.
              </div>
            )}
          </section>
        </aside>
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
          <CabecalhoSecao
            eyebrow="Operacao"
            title="Fila de pedidos"
            description="Os pedidos abaixo vem da API, podem ser filtrados e abrem um painel detalhado para atendimento."
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.85fr_auto]">
            <CampoTexto
              label="Buscar pedido ou cliente"
              value={pedidoSearch}
              onChange={setPedidoSearch}
              placeholder="Pedido, cliente, observacao ou status"
            />
            <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
              Filtrar por status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PedidoStatusFiltro)
                }
                className="rounded-2xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-4 focus:ring-[color:var(--color-accent-soft)]"
              >
                {PEDIDO_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-[24px] border border-[color:var(--color-line)] bg-white/70 px-4 py-4 text-sm text-[color:var(--color-muted)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                Visiveis
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                {pedidosFiltrados.length}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em]">
                de {dashboard.pedidos.length} pedidos
              </p>
            </div>
          </div>

          {pedidosFiltrados.length > 0 ? (
            <div
              className="mt-4 grid gap-4"
              role="region"
              aria-label="Fila de pedidos"
            >
              {pedidosFiltrados.map((pedido) => {
                const pedidoAtivo = pedidoSelecionadoId === pedido.id;

                return (
                  <article
                    key={pedido.id}
                    className={`rounded-[24px] border bg-white/80 p-4 transition ${
                      pedidoAtivo
                        ? "border-[color:var(--color-accent)] shadow-[0_18px_38px_rgba(9,112,96,0.12)]"
                        : "border-[color:var(--color-line)]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                            {formatStatus(pedido.status)}
                          </span>
                          <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                            {formatDateTime(pedido.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                          Pedido {pedido.id}
                        </h3>
                        <p className="text-sm text-[color:var(--color-muted)]">
                          Cliente:{" "}
                          {resolverNomeCliente(dashboard.clientes, pedido.clienteId)}
                        </p>
                        <p className="text-sm text-[color:var(--color-muted)]">
                          Prazo: {formatPrazo(pedido.prazo)}
                        </p>
                        {pedido.observacoes ? (
                          <p className="text-sm leading-6 text-[color:var(--foreground)]">
                            {pedido.observacoes}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid min-w-[16rem] gap-3">
                        <ResumoLinha
                          label="Subtotal"
                          value={currencyFormatter.format(pedido.subtotal)}
                        />
                        <ResumoLinha
                          label="Urgencia"
                          value={currencyFormatter.format(pedido.taxaUrgencia)}
                        />
                        <ResumoLinha
                          label="Total"
                          value={currencyFormatter.format(pedido.total)}
                        />
                        <button
                          type="button"
                          aria-label={`Ver detalhes do pedido ${pedido.id}`}
                          onClick={() =>
                            void handleAbrirPedido(
                              pedido.id,
                              `Pedido ${pedido.id} aberto pela fila operacional.`,
                            )
                          }
                          className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-accent)] transition hover:border-[color:var(--color-accent)]"
                        >
                          {pedidoAtivo && isLoadingPedidoDetalhado
                            ? "Atualizando detalhe..."
                            : "Ver detalhes"}
                        </button>
                        <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                          Atualizar status
                          <select
                            aria-label={`Atualizar status do pedido ${pedido.id}`}
                            value={pedido.status}
                            onChange={(event) =>
                              void handleStatusChange(
                                pedido.id,
                                event.target.value as PedidoStatus,
                              )
                            }
                            className="rounded-2xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-4 focus:ring-[color:var(--color-accent-soft)]"
                          >
                            {PEDIDO_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-[color:var(--color-line)] bg-white/55 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
              Nenhum pedido combina com os filtros atuais. Ajuste a busca ou o
              status para voltar a ver a fila completa.
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <section
            className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur"
            role="region"
            aria-label="Detalhes do pedido"
          >
            <CabecalhoSecao
              eyebrow="Contexto"
              title="Detalhes do pedido"
              description="A selecao ativa mostra cliente, composicao do pedido e arquivos associados para acelerar o atendimento."
            />

            {pedidoDetalheError ? (
              <FeedbackBox tone="warning" className="mt-4">
                {pedidoDetalheError}
              </FeedbackBox>
            ) : null}

            {isLoadingPedidoDetalhado ? (
              <div className="mt-4 rounded-[24px] border border-[color:var(--color-line)] bg-white/75 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
                Carregando detalhes do pedido selecionado...
              </div>
            ) : pedidoSelecionado ? (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 rounded-[24px] border border-[color:var(--color-line)] bg-white/75 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                      {formatStatus(pedidoSelecionado.status)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      {formatDateTime(
                        pedidoSelecionado.createdAt ??
                          pedidoSelecionadoResumo?.createdAt ??
                          new Date().toISOString(),
                      )}
                    </span>
                  </div>
                  <ResumoLinha label="Pedido" value={pedidoSelecionado.id} />
                  <ResumoLinha
                    label="Cliente"
                    value={clienteSelecionado?.nome ?? pedidoSelecionado.clienteId}
                  />
                  <ResumoLinha
                    label="Telefone"
                    value={clienteSelecionado?.telefone ?? "Nao informado"}
                  />
                  <ResumoLinha
                    label="Prazo"
                    value={formatPrazo(pedidoSelecionado.prazo)}
                  />
                  <ResumoLinha
                    label="Subtotal"
                    value={currencyFormatter.format(pedidoSelecionado.subtotal)}
                  />
                  <ResumoLinha
                    label="Urgencia"
                    value={currencyFormatter.format(
                      pedidoSelecionado.taxaUrgencia,
                    )}
                  />
                  <ResumoLinha
                    label="Total"
                    value={currencyFormatter.format(pedidoSelecionado.total)}
                  />
                  {pedidoSelecionado.observacoes ? (
                    <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-accent-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
                      {pedidoSelecionado.observacoes}
                    </div>
                  ) : null}
                </div>

                <DetalheLista
                  title="Itens precificados"
                  emptyMessage="Nenhum item de precificacao registrado."
                  items={pedidoSelecionado.itens ?? []}
                  renderItem={(item, index) => (
                    <li
                      key={`${item.tipo}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-3 py-3 text-sm"
                    >
                      <span className="text-[color:var(--foreground)]">
                        {formatarItemDoPedido(item)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                        qtd {item.quantidade}
                      </span>
                    </li>
                  )}
                />

                <DetalheLista
                  title="Fotos vinculadas"
                  emptyMessage="Nenhuma foto vinculada a este pedido."
                  items={pedidoSelecionado.fotos}
                  renderItem={(foto) => (
                    <li
                      key={foto.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-3 py-3 text-sm"
                    >
                      <div className="grid gap-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          {foto.arquivoNome}
                        </span>
                        <span className="text-[color:var(--color-muted)]">
                          {foto.tamanho} • qtd {foto.quantidade}
                        </span>
                      </div>
                      {foto.arquivoUrl ? (
                        <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                          upload pronto
                        </span>
                      ) : null}
                    </li>
                  )}
                />

                <DetalheLista
                  title="Documentos vinculados"
                  emptyMessage="Nenhum documento vinculado a este pedido."
                  items={pedidoSelecionado.documentos}
                  renderItem={(documento) => (
                    <li
                      key={documento.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-3 py-3 text-sm"
                    >
                      <div className="grid gap-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          {documento.arquivoNome}
                        </span>
                        <span className="text-[color:var(--color-muted)]">
                          {documento.colorido ? "Colorido" : "Preto e branco"} •
                          qtd {documento.quantidade}
                        </span>
                      </div>
                      {documento.arquivoUrl ? (
                        <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                          upload pronto
                        </span>
                      ) : null}
                    </li>
                  )}
                />
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-[color:var(--color-line)] bg-white/55 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
                Selecione um pedido na fila para abrir o contexto completo de
                producao e atendimento.
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <CabecalhoSecao
              eyebrow="Atendimento"
              title="Notificacoes"
              description="A fila de notificacoes mostra entradas novas do backend e permite abrir o pedido relacionado ou marcar o item como tratado."
            />

            {notificacoesOrdenadas.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {notificacoesOrdenadas.map((notificacao) => (
                  <article
                    key={notificacao.id}
                    className={`rounded-[24px] border p-4 ${
                      notificacao.lida
                        ? "border-[color:var(--color-line)] bg-white/70"
                        : "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                          {notificacao.tipo}
                        </span>
                        <span className="text-xs text-[color:var(--color-muted)]">
                          {formatDateTime(notificacao.criadaEm)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--foreground)]">
                        {notificacao.mensagem}
                      </p>
                      <p className="text-sm text-[color:var(--color-muted)]">
                        Pedido relacionado: {notificacao.pedidoId}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label={`Abrir pedido ${notificacao.pedidoId}`}
                          onClick={() =>
                            void handleAbrirPedido(
                              notificacao.pedidoId,
                              `Pedido ${notificacao.pedidoId} aberto a partir da notificacao ${notificacao.id}.`,
                            )
                          }
                          className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--color-accent)]"
                        >
                          Abrir pedido
                        </button>
                        <button
                          type="button"
                          aria-label={`Marcar notificacao ${notificacao.id} como lida`}
                          disabled={notificacao.lida}
                          onClick={() =>
                            void handleMarcarNotificacaoComoLida(notificacao.id)
                          }
                          className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {notificacao.lida ? "Ja lida" : "Marcar como lida"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-[color:var(--color-line)] bg-white/55 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
                Nenhuma notificacao registrada ainda.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function CabecalhoSecao({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-4 focus:ring-[color:var(--color-accent-soft)]"
      />
    </label>
  );
}

function ListaArquivos({
  title,
  files,
  emptyMessage,
}: {
  title: string;
  files: File[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--color-line)] bg-white/60 p-4">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">
        {title}
      </p>
      {files.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--color-line)] bg-white/80 px-3 py-2 text-sm text-[color:var(--foreground)]"
            >
              <span className="truncate pr-4">{file.name}</span>
              <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                {formatFileSize(file.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function DetalheLista<T>({
  title,
  items,
  emptyMessage,
  renderItem,
}: {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--color-line)] bg-white/75 p-4">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {items.map((item, index) => renderItem(item, index))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function ResumoNumero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--color-line)] bg-white/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function ResumoLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="text-right font-semibold text-[color:var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function FeedbackBox({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone: "error" | "warning";
  className?: string;
}) {
  const toneClassName =
    tone === "error"
      ? "border-[#e59f88] bg-[#fff1eb] text-[#8a3f21]"
      : "border-[#d6c38c] bg-[#fff7df] text-[#6b5721]";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClassName} ${className}`}
    >
      {children}
    </div>
  );
}

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parsePositiveInteger(value: string, fieldLabel: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Informe uma ${fieldLabel} valida maior que zero.`);
  }

  return parsed;
}

function resolverNomeCliente(clientes: Cliente[], clienteId: string): string {
  return clientes.find((cliente) => cliente.id === clienteId)?.nome ?? clienteId;
}

function resolverProximoPedidoSelecionadoId(
  pedidos: PedidoResumo[],
  pedidoSelecionadoId: string | null,
): string | null {
  if (pedidoSelecionadoId) {
    const pedidoAindaExiste = pedidos.some((pedido) => pedido.id === pedidoSelecionadoId);

    if (pedidoAindaExiste) {
      return pedidoSelecionadoId;
    }
  }

  const pedidoMaisRecente = [...pedidos].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  return pedidoMaisRecente?.id ?? null;
}

function formatStatus(status: PedidoStatus): string {
  return (
    PEDIDO_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

function formatPrazo(prazo: PrazoPedido): string {
  return PRAZO_OPTIONS.find((option) => option.value === prazo)?.label ?? prazo;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatarItemDoPedido(
  item: NonNullable<PedidoDetalhado["itens"]>[number],
): string {
  if (item.tipo === "foto") {
    return `Foto ${item.tamanho}`;
  }

  return `Documento ${item.colorido ? "colorido" : "preto e branco"}`;
}
