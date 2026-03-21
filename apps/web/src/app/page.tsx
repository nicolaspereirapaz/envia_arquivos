"use client";

import Image from "next/image";
import {
  startTransition,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import {
  FOTO_TAMANHOS,
  PHOTO_CROP_PRESETS,
  PRAZO_OPTIONS,
  createCliente,
  createPedido,
  getCliente,
  getDefaultApiBaseUrl,
  getPedidoDetalhado,
  getWhatsappResumo,
  simularPrecificacao,
  uploadArquivos,
  type Cliente,
  type FotoTamanho,
  type PedidoDetalhado,
  type PrazoPedido,
  type SimulacaoPrecificacao,
  type UploadedArquivo,
  type WhatsappResumoPedido,
} from "@/lib/fare-foto-web-api";

type CropPreset = (typeof PHOTO_CROP_PRESETS)[number]["value"];

interface PhotoDraft {
  id: string;
  file: File;
  previewUrl: string;
  tamanho: FotoTamanho;
  quantidade: string;
  brilho: number;
  contraste: number;
  saturacao: number;
  cropPreset: CropPreset;
}

interface DocumentDraft {
  id: string;
  file: File;
  quantidade: string;
  colorido: boolean;
  tipoImpressao: string;
  acabamento: string;
}

interface FlowResult {
  cliente: Cliente;
  pedido: PedidoDetalhado;
  whatsapp: WhatsappResumoPedido;
  uploads: {
    photos: UploadedArquivo[];
    documents: UploadedArquivo[];
  };
}

interface TrackingResult {
  cliente: Cliente;
  pedido: PedidoDetalhado;
  whatsapp: WhatsappResumoPedido;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Home() {
  const apiBaseUrl = getDefaultApiBaseUrl();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [prazo, setPrazo] = useState<PrazoPedido>("uma_hora");
  const [photoDrafts, setPhotoDrafts] = useState<PhotoDraft[]>([]);
  const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
  const [simulacao, setSimulacao] = useState<SimulacaoPrecificacao | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(
    null,
  );
  const [simulacaoError, setSimulacaoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const totalArquivos = photoDrafts.length + documentDrafts.length;
  const totalItens = photoDrafts.length + documentDrafts.length;

  async function handleSimular() {
    if (totalItens === 0) {
      setSimulacaoError("Adicione ao menos uma foto ou documento para simular.");
      return;
    }

    setIsSimulating(true);
    setSimulacaoError(null);

    try {
      const result = await simularPrecificacao(
        apiBaseUrl,
        criarPayloadDeSimulacao(photoDrafts, documentDrafts, prazo),
      );
      setSimulacao(result);
    } catch (error) {
      setSimulacaoError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel simular o preco agora.",
      );
    } finally {
      setIsSimulating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nome.trim().length === 0 || telefone.trim().length === 0) {
      setSubmitError("Preencha nome e telefone antes de enviar o pedido.");
      return;
    }

    if (totalItens === 0) {
      setSubmitError("Adicione ao menos um arquivo para criar o pedido.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const [uploadedPhotos, uploadedDocuments] = await Promise.all([
        uploadArquivos(
          apiBaseUrl,
          "photos",
          photoDrafts.map((item) => item.file),
        ),
        uploadArquivos(
          apiBaseUrl,
          "documents",
          documentDrafts.map((item) => item.file),
        ),
      ]);

      const cliente = await createCliente(apiBaseUrl, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        observacoes: normalizeOptionalText(observacoes),
      });

      const pedido = await createPedido(apiBaseUrl, {
        clienteId: cliente.id,
        prazo,
        observacoes: normalizeOptionalText(observacoes),
        fotos: photoDrafts.map((item, index) => ({
          arquivoUrl: uploadedPhotos[index]?.url,
          tamanho: item.tamanho,
          quantidade: parsePositiveInteger(item.quantidade, "quantidade da foto"),
          brilho: item.brilho,
          contraste: item.contraste,
          saturacao: item.saturacao,
          cropData: createCropData(item.cropPreset),
        })),
        documentos: documentDrafts.map((item, index) => ({
          arquivoUrl: uploadedDocuments[index]?.url,
          quantidade: parsePositiveInteger(
            item.quantidade,
            "quantidade do documento",
          ),
          colorido: item.colorido,
          tipoImpressao: normalizeOptionalText(item.tipoImpressao),
          acabamento: normalizeOptionalText(item.acabamento),
        })),
      });

      const whatsapp = await getWhatsappResumo(apiBaseUrl, pedido.id);

      setFlowResult({
        cliente,
        pedido,
        whatsapp,
        uploads: {
          photos: uploadedPhotos,
          documents: uploadedDocuments,
        },
      });
      setTrackingCode(pedido.id);

      startTransition(() => {
        setTrackingResult({
          cliente,
          pedido,
          whatsapp,
        });
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar o pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTrackOrder() {
    if (trackingCode.trim().length === 0) {
      setTrackingError("Informe o codigo do pedido para acompanhar.");
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    try {
      const pedido = await getPedidoDetalhado(apiBaseUrl, trackingCode.trim());
      const [cliente, whatsapp] = await Promise.all([
        getCliente(apiBaseUrl, pedido.clienteId),
        getWhatsappResumo(apiBaseUrl, pedido.id),
      ]);

      startTransition(() => {
        setTrackingResult({
          cliente,
          pedido,
          whatsapp,
        });
      });
    } catch (error) {
      setTrackingError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel acompanhar esse pedido agora.",
      );
    } finally {
      setIsTracking(false);
    }
  }

  function handlePhotoFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setSimulacao(null);
    setPhotoDrafts((current) => [...current, ...files.map(createPhotoDraft)]);
    event.target.value = "";
  }

  function handleDocumentFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setSimulacao(null);
    setDocumentDrafts((current) => [
      ...current,
      ...files.map(createDocumentDraft),
    ]);
    event.target.value = "";
  }

  function atualizarFoto(id: string, partial: Partial<PhotoDraft>) {
    setSimulacao(null);
    setPhotoDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    );
  }

  function atualizarDocumento(id: string, partial: Partial<DocumentDraft>) {
    setSimulacao(null);
    setDocumentDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    );
  }

  function removerFoto(id: string) {
    setSimulacao(null);
    setPhotoDrafts((current) => {
      const item = current.find((entry) => entry.id === id);

      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((entry) => entry.id !== id);
    });
  }

  function removerDocumento(id: string) {
    setSimulacao(null);
    setDocumentDrafts((current) =>
      current.filter((entry) => entry.id !== id),
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
      <section className="overflow-hidden rounded-[40px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] shadow-[var(--shadow-soft)]">
        <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-brand)]">
              Fare Foto
            </p>
            <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-fraunces)] text-4xl leading-tight tracking-[-0.05em] text-[color:var(--foreground)] sm:text-5xl lg:text-6xl">
              Envie fotos e documentos, ajuste o visual e acompanhe seu pedido no mesmo lugar.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--color-muted)]">
              A area do cliente agora cobre o fluxo completo da Fare Foto:
              upload, editor basico de imagem, simulacao automatica de preco,
              envio do pedido e acompanhamento com status atualizado.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <AncoraInterna href="#criar-pedido">Criar pedido</AncoraInterna>
              <AncoraInterna href="#acompanhar">Acompanhar pedido</AncoraInterna>
            </div>
          </div>

          <div className="grid gap-3 rounded-[32px] border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-5 sm:grid-cols-2">
            <ResumoNumero label="Arquivos prontos" value={String(totalArquivos)} />
            <ResumoNumero label="Itens no pedido" value={String(totalItens)} />
            <ResumoNumero
              label="Prazo escolhido"
              value={formatPrazo(prazo)}
            />
            <ResumoNumero
              label="Ultimo total"
              value={
                simulacao
                  ? currencyFormatter.format(simulacao.total)
                  : flowResult
                    ? currencyFormatter.format(flowResult.pedido.total)
                    : "R$ 0,00"
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          id="criar-pedido"
          onSubmit={handleSubmit}
          className="rounded-[36px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8"
        >
          <div className="grid gap-8">
            <section className="grid gap-4">
              <SectionHeader
                eyebrow="Cliente"
                title="Seus dados"
                description="Usamos essas informacoes para montar o pedido e deixar o atendimento mais rapido."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Nome"
                  value={nome}
                  onChange={setNome}
                  placeholder="Seu nome"
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
                placeholder="Observacoes de entrega, papel, acabamento ou referencia de cor."
              />
            </section>

            <section className="grid gap-4">
              <SectionHeader
                eyebrow="Prazo"
                title="Escolha a velocidade"
                description="A taxa de urgencia aparece automaticamente na simulacao."
              />
              <div className="grid gap-3 md:grid-cols-3">
                {PRAZO_OPTIONS.map((option) => {
                  const ativo = option.value === prazo;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPrazo(option.value);
                        setSimulacao(null);
                      }}
                      className={`rounded-[26px] border px-4 py-4 text-left transition ${
                        ativo
                          ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand)] text-white shadow-[0_20px_40px_rgba(239,106,69,0.22)]"
                          : "border-[color:var(--color-line)] bg-white/75 text-[color:var(--foreground)] hover:border-[color:var(--color-brand)]"
                      }`}
                    >
                      <p className="text-base font-semibold">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          ativo ? "text-white/80" : "text-[color:var(--color-muted)]"
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
              <SectionHeader
                eyebrow="Fotos"
                title="Editor basico"
                description="Ajuste brilho, contraste, saturacao e enquadramento antes de enviar."
              />

              <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                Arquivos de foto
                <input
                  aria-label="Arquivos de foto"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoFiles}
                  className="rounded-2xl border border-dashed border-[color:var(--color-line)] bg-white/75 px-4 py-4 text-sm text-[color:var(--color-muted)]"
                />
              </label>

              {photoDrafts.length > 0 ? (
                <div className="grid gap-4">
                  {photoDrafts.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-4 rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4 lg:grid-cols-[0.95fr_1.05fr]"
                    >
                      <div className="grid gap-3">
                        <div
                          className={`overflow-hidden rounded-[24px] border border-[color:var(--color-line)] bg-[color:var(--color-brand-alt-soft)] ${getCropPreviewClass(item.cropPreset)}`}
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={item.previewUrl}
                              alt={`Preview ${item.file.name}`}
                              fill
                              unoptimized
                              sizes="(max-width: 1024px) 100vw, 40vw"
                              className="object-cover"
                              style={createPhotoPreviewStyle(item)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-[color:var(--foreground)]">
                              {item.file.name}
                            </p>
                            <p className="text-[color:var(--color-muted)]">
                              {formatFileSize(item.file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerFoto(item.id)}
                            className="rounded-full border border-[color:var(--color-line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--color-brand)]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                            Tamanho
                            <select
                              aria-label={`Tamanho ${item.file.name}`}
                              value={item.tamanho}
                              onChange={(event) =>
                                atualizarFoto(item.id, {
                                  tamanho: event.target.value as FotoTamanho,
                                })
                              }
                              className="rounded-2xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-[rgba(239,106,69,0.14)]"
                            >
                              {FOTO_TAMANHOS.map((tamanho) => (
                                <option key={tamanho} value={tamanho}>
                                  {tamanho}
                                </option>
                              ))}
                            </select>
                          </label>
                          <CampoTexto
                            label="Quantidade"
                            value={item.quantidade}
                            onChange={(value) =>
                              atualizarFoto(item.id, { quantidade: value })
                            }
                            placeholder="1"
                            inputMode="numeric"
                            ariaLabel={`Quantidade ${item.file.name}`}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <SliderCampo
                            label="Brilho"
                            value={item.brilho}
                            min={60}
                            max={140}
                            onChange={(value) =>
                              atualizarFoto(item.id, { brilho: value })
                            }
                          />
                          <SliderCampo
                            label="Contraste"
                            value={item.contraste}
                            min={60}
                            max={140}
                            onChange={(value) =>
                              atualizarFoto(item.id, { contraste: value })
                            }
                          />
                          <SliderCampo
                            label="Saturacao"
                            value={item.saturacao}
                            min={0}
                            max={160}
                            onChange={(value) =>
                              atualizarFoto(item.id, { saturacao: value })
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <p className="text-sm font-medium text-[color:var(--foreground)]">
                            Enquadramento
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PHOTO_CROP_PRESETS.map((preset) => {
                              const ativo = item.cropPreset === preset.value;

                              return (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() =>
                                    atualizarFoto(item.id, {
                                      cropPreset: preset.value,
                                    })
                                  }
                                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                    ativo
                                      ? "border-[color:var(--color-brand-strong)] bg-[color:var(--color-brand-strong)] text-white"
                                      : "border-[color:var(--color-line)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--color-brand-strong)]"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EstadoVazio message="Adicione fotos para abrir o editor basico e configurar cada arquivo." />
              )}
            </section>

            <section className="grid gap-4">
              <SectionHeader
                eyebrow="Documentos"
                title="Configuracao de impressao"
                description="Cada arquivo pode levar sua propria quantidade e acabamento."
              />

              <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
                Arquivos de documento
                <input
                  aria-label="Arquivos de documento"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,image/*"
                  onChange={handleDocumentFiles}
                  className="rounded-2xl border border-dashed border-[color:var(--color-line)] bg-white/75 px-4 py-4 text-sm text-[color:var(--color-muted)]"
                />
              </label>

              {documentDrafts.length > 0 ? (
                <div className="grid gap-4">
                  {documentDrafts.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-4 rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {item.file.name}
                          </p>
                          <p className="text-sm text-[color:var(--color-muted)]">
                            {formatFileSize(item.file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerDocumento(item.id)}
                          className="rounded-full border border-[color:var(--color-line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--color-brand)]"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <CampoTexto
                          label="Quantidade"
                          value={item.quantidade}
                          onChange={(value) =>
                            atualizarDocumento(item.id, { quantidade: value })
                          }
                          placeholder="1"
                          inputMode="numeric"
                          ariaLabel={`Quantidade documento ${item.file.name}`}
                        />
                        <CampoTexto
                          label="Tipo de impressao"
                          value={item.tipoImpressao}
                          onChange={(value) =>
                            atualizarDocumento(item.id, { tipoImpressao: value })
                          }
                          placeholder="simples"
                          ariaLabel={`Tipo de impressao ${item.file.name}`}
                        />
                        <CampoTexto
                          label="Acabamento"
                          value={item.acabamento}
                          onChange={(value) =>
                            atualizarDocumento(item.id, { acabamento: value })
                          }
                          placeholder="sem acabamento"
                          ariaLabel={`Acabamento ${item.file.name}`}
                        />
                        <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">
                          <input
                            aria-label={`Documento colorido ${item.file.name}`}
                            type="checkbox"
                            checked={item.colorido}
                            onChange={(event) =>
                              atualizarDocumento(item.id, {
                                colorido: event.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-[color:var(--color-line)] text-[color:var(--color-brand-strong)]"
                          />
                          Documento colorido
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EstadoVazio message="Adicione documentos para configurar quantidade, cor e acabamento." />
              )}
            </section>

            <section className="grid gap-4 rounded-[32px] border border-[color:var(--color-line)] bg-[linear-gradient(135deg,rgba(239,106,69,0.1),rgba(11,122,104,0.1))] p-5">
              <SectionHeader
                eyebrow="Preco"
                title="Simule antes de enviar"
                description="A simulacao usa a regra real do backend e já considera o prazo escolhido."
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSimular()}
                  disabled={isSimulating}
                  className="rounded-full bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSimulating ? "Simulando..." : "Simular preco"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[color:var(--color-brand-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Enviando pedido..." : "Enviar pedido"}
                </button>
              </div>

              {simulacaoError ? (
                <FeedbackBox tone="error">{simulacaoError}</FeedbackBox>
              ) : null}

              {submitError ? (
                <FeedbackBox tone="error">{submitError}</FeedbackBox>
              ) : null}

              {simulacao ? (
                <div className="grid gap-4 rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ResumoLinha
                      label="Subtotal"
                      value={currencyFormatter.format(simulacao.subtotal)}
                    />
                    <ResumoLinha
                      label="Taxa de urgencia"
                      value={currencyFormatter.format(simulacao.taxaUrgencia)}
                    />
                    <ResumoLinha
                      label="Total"
                      value={currencyFormatter.format(simulacao.total)}
                    />
                  </div>

                  <div className="grid gap-2">
                    {simulacao.detalhes.map((detalhe, index) => (
                      <div
                        key={`${detalhe.descricao}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {detalhe.descricao}
                          </p>
                          <p className="text-[color:var(--color-muted)]">
                            {detalhe.quantidade} unidade(s) a{" "}
                            {currencyFormatter.format(detalhe.valorUnitario)}
                          </p>
                        </div>
                        <span className="font-semibold text-[color:var(--foreground)]">
                          {currencyFormatter.format(detalhe.totalItem)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </form>

        <aside className="grid gap-6">
          <section className="rounded-[36px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <SectionHeader
              eyebrow="Resultado"
              title="Pedido enviado"
              description="Quando o pedido for criado, o codigo e o resumo para WhatsApp aparecem aqui."
            />

            {flowResult ? (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4">
                  <ResumoLinha label="Cliente" value={flowResult.cliente.nome} />
                  <ResumoLinha label="Pedido" value={flowResult.pedido.id} />
                  <ResumoLinha
                    label="Prazo"
                    value={formatPrazo(flowResult.pedido.prazo)}
                  />
                  <ResumoLinha
                    label="Total"
                    value={currencyFormatter.format(flowResult.pedido.total)}
                  />
                  <ResumoLinha
                    label="Uploads"
                    value={String(
                      flowResult.uploads.photos.length +
                        flowResult.uploads.documents.length,
                    )}
                  />
                </div>

                <a
                  href={flowResult.whatsapp.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Abrir resumo no WhatsApp
                </a>

                <div className="rounded-[28px] border border-[color:var(--color-line)] bg-[#1f2740] px-4 py-4 text-sm leading-6 text-[#f5f0e7]">
                  {flowResult.whatsapp.mensagem}
                </div>
              </div>
            ) : (
              <EstadoVazio message="Seu codigo de pedido vai aparecer aqui assim que o envio terminar." />
            )}
          </section>

          <section
            id="acompanhar"
            className="rounded-[36px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur"
          >
            <SectionHeader
              eyebrow="Acompanhamento"
              title="Consulte o status do pedido"
              description="Digite o codigo recebido para rever cliente, itens enviados e o andamento da producao."
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <CampoTexto
                label="Codigo do pedido"
                value={trackingCode}
                onChange={setTrackingCode}
                placeholder="pedido-123"
              />
              <button
                type="button"
                onClick={() => void handleTrackOrder()}
                disabled={isTracking}
                className="mt-[1.85rem] rounded-full bg-[color:var(--color-brand-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTracking ? "Consultando..." : "Acompanhar"}
              </button>
            </div>

            {trackingError ? (
              <FeedbackBox tone="warning" className="mt-4">
                {trackingError}
              </FeedbackBox>
            ) : null}

            {trackingResult ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4">
                  <StatusTimeline status={trackingResult.pedido.status} />
                </div>

                <div className="grid gap-3 rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4">
                  <ResumoLinha label="Cliente" value={trackingResult.cliente.nome} />
                  <ResumoLinha
                    label="Telefone"
                    value={trackingResult.cliente.telefone}
                  />
                  <ResumoLinha
                    label="Criado em"
                    value={formatDateTime(
                      trackingResult.pedido.createdAt ?? new Date().toISOString(),
                    )}
                  />
                  <ResumoLinha
                    label="Prazo"
                    value={formatPrazo(trackingResult.pedido.prazo)}
                  />
                  <ResumoLinha
                    label="Total"
                    value={currencyFormatter.format(trackingResult.pedido.total)}
                  />
                </div>

                <DetailList
                  title="Fotos enviadas"
                  emptyMessage="Nenhuma foto registrada neste pedido."
                  items={trackingResult.pedido.fotos}
                  renderItem={(item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm"
                    >
                      <div className="grid gap-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          {item.arquivoNome}
                        </span>
                        <span className="text-[color:var(--color-muted)]">
                          {item.tamanho} • qtd {item.quantidade}
                        </span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                        {item.cropData ? "editada" : "original"}
                      </span>
                    </li>
                  )}
                />

                <DetailList
                  title="Documentos enviados"
                  emptyMessage="Nenhum documento registrado neste pedido."
                  items={trackingResult.pedido.documentos}
                  renderItem={(item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm"
                    >
                      <div className="grid gap-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          {item.arquivoNome}
                        </span>
                        <span className="text-[color:var(--color-muted)]">
                          {item.colorido ? "Colorido" : "Preto e branco"} • qtd{" "}
                          {item.quantidade}
                        </span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                        {item.acabamento ?? "padrao"}
                      </span>
                    </li>
                  )}
                />

                <a
                  href={trackingResult.whatsapp.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--color-brand)]"
                >
                  Abrir resumo do pedido
                </a>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}

function SectionHeader({
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
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-brand)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl tracking-[-0.04em] text-[color:var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
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
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  ariaLabel?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
      {label}
      <input
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[color:var(--color-line)] bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-[rgba(239,106,69,0.14)]"
      />
    </label>
  );
}

function SliderCampo({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[color:var(--foreground)]">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          {value}%
        </span>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-[color:var(--color-brand)]"
      />
    </label>
  );
}

function ResumoNumero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[color:var(--color-line)] bg-white/80 px-4 py-3">
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

function AncoraInterna({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--color-brand)]"
    >
      {children}
    </a>
  );
}

function EstadoVazio({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[color:var(--color-line)] bg-white/60 px-4 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
      {message}
    </div>
  );
}

function DetailList<T>({
  title,
  items,
  emptyMessage,
  renderItem,
}: {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[color:var(--color-line)] bg-white/80 p-4">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2">{items.map((item) => renderItem(item))}</ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          {emptyMessage}
        </p>
      )}
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
      ? "border-[#efb19e] bg-[#fff0ea] text-[#8e3d23]"
      : "border-[#d5c08c] bg-[#fff8df] text-[#6d5521]";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClassName} ${className}`}
    >
      {children}
    </div>
  );
}

function StatusTimeline({
  status,
}: {
  status: PedidoDetalhado["status"];
}) {
  const steps = [
    "recebido",
    "em_producao",
    "pronto",
    "entregue",
  ] as const;
  const currentIndex = steps.indexOf(status as (typeof steps)[number]);

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">
        Status atual: {formatStatus(status)}
      </p>
      <div className="grid gap-2">
        {steps.map((step, index) => {
          const ativo = currentIndex >= index;

          return (
            <div
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm"
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  ativo
                    ? "bg-[color:var(--color-brand-strong)] text-white"
                    : "bg-[color:var(--color-brand-soft)] text-[color:var(--foreground)]"
                }`}
              >
                {index + 1}
              </span>
              <span className="font-medium text-[color:var(--foreground)]">
                {formatStatus(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function createPhotoDraft(file: File): PhotoDraft {
  return {
    id: createLocalId(),
    file,
    previewUrl: URL.createObjectURL(file),
    tamanho: "10x15",
    quantidade: "1",
    brilho: 100,
    contraste: 100,
    saturacao: 100,
    cropPreset: "original",
  };
}

function createDocumentDraft(file: File): DocumentDraft {
  return {
    id: createLocalId(),
    file,
    quantidade: "1",
    colorido: false,
    tipoImpressao: "simples",
    acabamento: "sem acabamento",
  };
}

function createLocalId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parsePositiveInteger(value: string, fieldLabel: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Informe uma ${fieldLabel} valida maior que zero.`);
  }

  return parsed;
}

function criarPayloadDeSimulacao(
  photoDrafts: PhotoDraft[],
  documentDrafts: DocumentDraft[],
  prazo: PrazoPedido,
) {
  return {
    prazo,
    itens: [
      ...photoDrafts.map((item) => ({
        tipo: "foto" as const,
        tamanho: item.tamanho,
        quantidade: parsePositiveInteger(item.quantidade, "quantidade da foto"),
      })),
      ...documentDrafts.map((item) => ({
        tipo: "documento" as const,
        quantidade: parsePositiveInteger(
          item.quantidade,
          "quantidade do documento",
        ),
        colorido: item.colorido,
      })),
    ],
  };
}

function createCropData(preset: CropPreset): string | undefined {
  if (preset === "original") {
    return undefined;
  }

  return JSON.stringify({
    preset,
  });
}

function getCropPreviewClass(preset: CropPreset): string {
  switch (preset) {
    case "quadrado":
      return "aspect-square";
    case "retrato":
      return "aspect-[3/4]";
    case "paisagem":
      return "aspect-[4/3]";
    default:
      return "aspect-[4/5]";
  }
}

function createPhotoPreviewStyle(item: PhotoDraft): CSSProperties {
  return {
    filter: `brightness(${item.brilho}%) contrast(${item.contraste}%) saturate(${item.saturacao}%)`,
  };
}

function formatPrazo(prazo: PrazoPedido): string {
  return PRAZO_OPTIONS.find((option) => option.value === prazo)?.label ?? prazo;
}

function formatStatus(status: PedidoDetalhado["status"]): string {
  switch (status) {
    case "recebido":
      return "Recebido";
    case "em_producao":
      return "Em producao";
    case "pronto":
      return "Pronto";
    case "entregue":
      return "Entregue";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
