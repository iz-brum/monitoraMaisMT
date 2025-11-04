import React, { useState } from 'react';

import { syntaxHighlight } from '@shared/utils/jsonHighlighter';

const ConteudoDinamico = ({ dados, titulo }) => {
    const [modoTabela, setModoTabela] = useState(true);
    const [imagemModal, setImagemModal] = useState(null); // índice da imagem no array
    const imagens = dados?.properties ? extrairImagensDasProperties(dados.properties) : [];

    const descricaoHtml = dados?.properties?.description;
    const temTabelaHTML = typeof descricaoHtml === 'string' && descricaoHtml.includes('<table');

    const renderTabelaHTML = () => (
        <div
            className="hud-table-wrapper"
            dangerouslySetInnerHTML={{ __html: descricaoHtml }}
            style={{ maxWidth: 800, overflowX: 'auto' }}
        />
    );

    const renderPropertiesTabela = () => (
        <div className="hud-table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Campo</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(dados.properties)
                        .filter(([chave]) => !chave.endsWith('_url'))
                        .map(([chave, valor]) => (
                            <tr key={chave}>
                                <td>{chave}</td>
                                <td style={{ whiteSpace: 'normal', maxWidth: 350 }}>
                                    {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );

    // Debug das imagens encontradas
    if (imagens.length > 0) {
        console.debug('[ConteudoDinamico] Imagens encontradas nas properties:', imagens);
    }

    // Função para avançar/voltar na galeria
    const handleAvancar = (e) => {
        e.stopPropagation();
        setImagemModal((idx) => (idx + 1) % imagens.length);
    };
    const handleVoltar = (e) => {
        e.stopPropagation();
        setImagemModal((idx) => (idx - 1 + imagens.length) % imagens.length);
    };

    return (
        <div>
            {dados?._tituloInterno && <h4 style={{ marginTop: 0 }}>{dados._tituloInterno}</h4>}

            <div style={{ marginBottom: 10 }}>
                <button onClick={() => setModoTabela(!modoTabela)}>
                    {modoTabela ? '🔧 Ver como JSON' : '📋 Ver como Tabela'}
                </button>
            </div>

            {modoTabela ? (
                temTabelaHTML ? renderTabelaHTML() :
                    dados?.properties ? renderPropertiesTabela() :
                        <p>Nenhum dado tabular disponível.</p>
            ) : (
                <pre
                    className="hud-json-viewer"
                    dangerouslySetInnerHTML={{
                        __html: syntaxHighlight(
                            {
                                ...dados,
                                properties: Object.fromEntries(
                                    Object.entries(dados.properties || {}).filter(([k]) => !k.endsWith('_url'))
                                )
                            }
                        )
                    }}
                />
            )}

            {imagens.length > 0 && (
                <div className="hud-imagens-galeria">
                    {imagens.map((src, idx) => (
                        <img
                            key={idx}
                            src={src}
                            alt={`Imagem ${idx + 1}`}
                            style={{ maxWidth: 200, margin: 8, borderRadius: 2, cursor: 'zoom-in' }}
                            onClick={() => setImagemModal(idx)}
                        />
                    ))}
                </div>
            )}
            {imagemModal !== null && imagens[imagemModal] && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'zoom-out'
                    }}
                    onClick={() => setImagemModal(null)}
                >
                    <button
                        onClick={handleVoltar}
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: '60%',
                            transform: 'translateY(-50%)',
                            fontSize: 32,
                            background: 'rgba(235, 219, 219, 0.22)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                        }}
                        title="Anterior"
                    >
                        <span style={{ display: 'inline-block', lineHeight: 1, fontSize: 32, marginTop: -7 }}>‹</span>
                    </button>
                    <img
                        src={imagens[imagemModal]}
                        alt={`Imagem em tela cheia`}
                        style={{
                            maxWidth: '98%',
                            maxHeight: 900,
                            boxShadow: '0 0 20px #000',
                            borderRadius: 4,
                            background: '#222',
                            objectFit: 'contain'
                        }}
                        draggable
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={handleAvancar}
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '60%',
                            transform: 'translateY(-50%)',
                            fontSize: 32,
                            background: 'rgba(235, 219, 219, 0.22)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                        }}
                        title="Próxima"
                    >
                        <span style={{ display: 'inline-block', lineHeight: 1, fontSize: 32, marginTop: -7 }}>›</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConteudoDinamico;

function extrairImagensDasProperties(properties) {
    // Busca propriedades terminadas com _url
    return Object.entries(properties)
        .filter(([k, v]) => /_url$/.test(k) && typeof v === 'string' && v.startsWith('blob:'))
        .map(([k, v]) => v);
}