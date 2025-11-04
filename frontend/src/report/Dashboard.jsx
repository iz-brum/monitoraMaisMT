import React from 'react';

export default function Dashboard({ stats }) {
    // Protege contra stats.testResults indefinido
    const testSuites = Array.isArray(stats.testResults) ? stats.testResults : [];
    const numPassedTests = stats.numPassedTests || 0;
    const numFailedTests = stats.numFailedTests || 0;
    const numPendingTests = stats.numPendingTests || 0;
    const numTodoTests = stats.numTodoTests || 0;
    const numRuntimeErrorTestSuites = stats.numRuntimeErrorTestSuites || 0;

    const totalTests = numPassedTests + numFailedTests + numPendingTests;
    const validTests = totalTests - numPendingTests || 1; // evita divisão por zero
    const successPercentage = Math.round((numPassedTests / validTests) * 100);

    // Total de asserts
    const totalAsserts = testSuites.reduce(
        (sum, suite) =>
            sum +
            (suite.testResults
                ? suite.testResults.reduce((s, t) => s + (t.numPassingAsserts || 0), 0)
                : 0),
        0
    );

    // Duração total, média, maior e menor
    const durations = testSuites.flatMap(suite =>
        (suite.testResults || []).map(test => test.duration || 0)
    );
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const avgDuration = durations.length ? Math.round(totalDuration / durations.length) : 0;
    const maxDuration = durations.length ? Math.max(...durations) : 0;
    const minDuration = durations.length ? Math.min(...durations) : 0;

    // Teste com mais asserts
    const allTests = testSuites.flatMap(suite => suite.testResults || []);
    const testMostAsserts = allTests.reduce(
        (max, test) => (test.numPassingAsserts > (max?.numPassingAsserts || 0) ? test : max),
        null
    );

    // Filtra apenas os testes executados (passados ou falhos)
    const testesExecutados = allTests.filter(
        test => test.status === "passed" || test.status === "failed"
    );

    // Agrupamento por ancestorTitles só dos executados
    const agrupamentosExecutados = {};
    testesExecutados.forEach(test => {
        const key = (test.ancestorTitles || []).join(' > ');
        agrupamentosExecutados[key] = (agrupamentosExecutados[key] || 0) + 1;
    });

    const snapshot = stats.snapshot || { total: 0, added: 0, filesRemoved: 0, updated: 0 };

    // Horário de início e fim
    const startTime = stats.startTime ? new Date(stats.startTime).toLocaleString() : "-";
    // Fim: pega o maior "end" de perfStats das suítes
    const endTimes = testSuites.map(suite => suite.perfStats?.end).filter(Boolean);
    const endTime = endTimes.length ? new Date(Math.max(...endTimes)).toLocaleString() : "-";

    return (
        <div>
            {/* RESUMO */}
            <section>
                <article>
                    <h2>Taxa de Sucesso</h2>
                    <p>{successPercentage}%</p>
                    <p>
                        {numPassedTests}/{validTests} testes válidos
                    </p>
                </article>

                <article>
                    <h2>Verificações Realizadas</h2>
                    <p>{totalAsserts}</p>
                    {testMostAsserts && (
                        <div>
                            <strong>Cenário com mais verificações:</strong>
                            <div>
                                {testMostAsserts.title}
                                <span>{testMostAsserts.numPassingAsserts}</span>
                            </div>
                        </div>
                    )}
                </article>
            </section>

            {/* MÉTRICAS */}
            <section>
                <article>
                    <h3>Duração dos Testes</h3>
                    <div>
                        <div>
                            <span>Total</span>
                            <span>{totalDuration}ms</span>
                        </div>
                        <div>
                            <span>Média</span>
                            <span>{avgDuration}ms</span>
                        </div>
                        <div>
                            <span>Máx</span>
                            <span>{maxDuration}ms</span>
                        </div>
                        <div>
                            <span>Mín</span>
                            <span>{minDuration}ms</span>
                        </div>
                    </div>
                </article>

                <article>
                    <h3>Testes Pulados</h3>
                    <p>{numPendingTests}</p>
                    <p>
                        {numPendingTests === 0
                            ? "Nenhum teste foi pulado!"
                            : `${((numPendingTests / totalTests) * 100).toFixed(1)}% dos testes (${numPendingTests}/${totalTests}) foram pulados.`}
                    </p>
                </article>

                <article>
                    <h3>Testes Falhos</h3>
                    <p>{numFailedTests}</p>
                    <p>
                        {numFailedTests === 0 ? "Tudo passou sem falhas!" : "Atenção: há testes com erro."}
                    </p>
                </article>

                <article>
                    <h3>Suítes de Teste</h3>
                    <p>{testSuites.length}</p>
                    <p>
                        {testSuites.length === 1 ? "1 suíte executada" : `${testSuites.length} suítes executadas`}
                    </p>
                </article>

                <article>
                    <h3>Testes TODO</h3>
                    <p>{numTodoTests}</p>
                    <p>
                        {numTodoTests === 0 ? "Nenhum teste pendente!" : "Existem testes marcados como TODO."}
                    </p>
                </article>

                <article>
                    <h3>Falhas de Runtime</h3>
                    <p>{numRuntimeErrorTestSuites}</p>
                    <p>
                        {numRuntimeErrorTestSuites === 0 ? "Nenhum erro de execução!" : "Algumas suítes falharam ao rodar."}
                    </p>
                </article>
            </section>

            {/* SNAPSHOTS */}
            <section>
                <h3>Snapshots</h3>
                <ul>
                    <li>
                        <span>Total</span>
                        <span>{snapshot.total}</span>
                    </li>
                    <li>
                        <span>Adicionados</span>
                        <span>{snapshot.added}</span>
                    </li>
                    <li>
                        <span>Removidos</span>
                        <span>{snapshot.filesRemoved}</span>
                    </li>
                    <li>
                        <span>Atualizados</span>
                        <span>{snapshot.updated}</span>
                    </li>
                </ul>
            </section>

            <section>
                <h3>Horário de Execução</h3>
                <div>
                    <div>
                        <span>Início:</span>
                        <span>{startTime}</span>
                    </div>
                    <div>
                        <span>Fim:</span>
                        <span>{endTime}</span>
                    </div>
                </div>
            </section>

            {/* AGRUPAMENTOS */}
            <section>
                <h3>Testes Executados</h3>
                <ul>
                    {Object.entries(agrupamentosExecutados).map(([group, count]) => (
                        <li key={group}>
                            <span>{group}</span>
                            <span>{count} teste(s)</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}