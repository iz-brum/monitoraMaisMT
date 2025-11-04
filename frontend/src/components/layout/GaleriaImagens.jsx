// GaleriaImagens.jsx
import React from 'react';

const GaleriaImagens = ({ imagens, onImagemClick }) => {
    if (!imagens.length) return null;

    return (
        <div className="hud-imagens-galeria">
            {imagens.map((src, idx) => (
                <img
                    key={idx}
                    src={src}
                    alt={`Imagem ${idx + 1}`}
                    style={{
                        maxWidth: 200,
                        margin: 8,
                        borderRadius: 2,
                        cursor: 'zoom-in'
                    }}
                    onClick={() => onImagemClick(src)}
                />
            ))}
        </div>
    );
};

export default GaleriaImagens;
