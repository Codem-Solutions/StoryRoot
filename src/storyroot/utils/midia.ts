import { Directory, File, Paths } from 'expo-file-system';

/**
 * Gravações e capturas nascem na pasta de cache, que o sistema pode limpar a
 * qualquer momento. Copia o arquivo para a pasta de documentos do app para que a
 * memória continue tocando depois. Se a cópia falhar, devolve a URI original.
 */
export async function salvarMidiaPermanente(uri: string, pasta: string): Promise<string> {
  try {
    const destino = new Directory(Paths.document, pasta);
    destino.create({ idempotent: true, intermediates: true });
    const origem = new File(uri);
    const extensao = origem.extension || '';
    const arquivo = new File(destino, `${Date.now()}${extensao}`);
    await origem.copy(arquivo);
    return arquivo.uri;
  } catch {
    return uri;
  }
}

/** Como `salvarMidiaPermanente`, para vários arquivos; os que já estão salvos ficam como estão. */
export function salvarMidiasPermanentes(uris: string[], pasta: string): Promise<string[]> {
  const raiz = Paths.document.uri;
  return Promise.all(
    uris.map(uri => (uri.startsWith(raiz) ? Promise.resolve(uri) : salvarMidiaPermanente(uri, pasta))),
  );
}
