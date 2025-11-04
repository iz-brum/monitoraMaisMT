import React, { useState, useEffect } from "react";

export default function ImportedLayerControls({
    layer,
    onChangeOpacity,
    onFechar,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(layer?.opacity ?? 1);

    useEffect(() => {
        setInputValue(layer?.opacity ?? 1);
    }, [layer?.opacity]);

    if (!layer) return null;

    const handleOpacityChange = (e) => {
        const novaOpacidade = parseFloat(e.target.value);
        setInputValue(novaOpacidade);
        onChangeOpacity(layer.id, novaOpacidade);
    };

    return (
        <div
            className="imported-layer-control"
            style={{
                marginBottom: 12,
                background: "rgba(255,255,255,0.35)",
                borderRadius: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                padding: "10px 12px",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch"
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer"
                }}
                onClick={() => setIsOpen(o => !o)}
            >
                <span style={{
                    flex: 1,
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#212237",
                    wordBreak: "break-word",
                    minWidth: 0
                }}>
                    Configurações da camada
                </span>

                <span style={{
                    marginLeft: 8,
                    fontSize: 18,
                    color: "#232c4c",
                    transition: "transform 0.18s",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    userSelect: "none"
                }}>
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <polyline points="7,6 13,10 7,14" fill="none" stroke="#232c4c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
                    <label style={{ flex: 1, fontSize: 15 }}>
                        Opacidade
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={inputValue}
                            onChange={handleOpacityChange}
                            style={{ width: 220, margin: '0px 15px 0px 10px', verticalAlign: "middle" }}
                        />
                        <span style={{
                            minWidth: 38,
                            display: "inline-block",
                            textAlign: "right",
                            color: "#232c4c",
                            fontWeight: 600
                        }}>
                            {Math.round(inputValue * 100)}%
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
}