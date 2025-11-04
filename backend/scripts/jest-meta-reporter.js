// backend/scripts/jest-meta-reporter.js

import fs from 'fs';
import path from 'path';

/**
 * MetaReporter
 * 
 * Reporter customizado para o Jest que salva um relatório detalhado dos testes em formato JSON.
 * 
 * Funcionalidades:
 * - Para cada teste executado, coleta informações detalhadas (nome, status, duração, falhas, etc).
 * - Enriquece cada teste com metadados customizados (campo "meta") vindos de um arquivo auxiliar (test-meta-dump.json).
 * - Ao final da execução, salva todos os resultados no arquivo especificado (ex: ./reports/test-meta-report.json).
 * 
 * Uso:
 * - Configurado via jest.config.mjs na opção "reporters".
 * - O arquivo gerado pode ser consumido por sistemas de relatórios, dashboards ou para auditoria.
 */
class MetaReporter {
  /**
   * Construtor do reporter.
   * @param {Object} globalConfig - Configuração global do Jest.
   * @param {Object} options - Opções passadas na configuração do reporter.
   */
  constructor(globalConfig, options) {
    this.results = []; // Armazena todos os resultados dos testes
    this.metaDumpPath = './reports/test-meta-dump.json'; // Caminho do arquivo auxiliar de metadados
    this.outputFile = options.outputFile || './reports/test-meta-report.json'; // Caminho do arquivo de saída
  }

  /**
   * onTestResult
   * Chamado pelo Jest após a execução de cada arquivo de teste.
   * @param {Object} test - Informações do teste.
   * @param {Object} testResult - Resultado do teste.
   * @param {Object} aggregatedResult - Resultado agregado (não utilizado aqui).
   */
  onTestResult(test, testResult, aggregatedResult) {
    // Carrega os metadados customizados salvos durante os testes (se existirem)
    let metaDump = [];
    if (fs.existsSync(this.metaDumpPath)) {
      metaDump = JSON.parse(fs.readFileSync(this.metaDumpPath, 'utf-8'));
    }
    // Cria um mapa para acesso rápido aos metadados pelo nome completo do teste
    const metaMap = Object.fromEntries(metaDump.map(m => [m.fullName, m.meta]));
    const resumoMap = Object.fromEntries(metaDump.map(m => [m.fullName, m.resumoResultado]));

    // Para cada asserção/teste individual, monta o objeto de resultado
    testResult.testResults.forEach(assertion => {
      this.results.push({
        suite: path.basename(testResult.testFilePath), 
        // Nome do arquivo de teste
        fullName: assertion.fullName,                  
        // Nome completo do teste (inclui describe + it)
        title: assertion.title,                        
        // Título do teste (it)
        status: assertion.status,                      
        // Status: passed, failed, pending, etc
        duration: assertion.duration,                  
        // Duração em ms
        ancestorTitles: assertion.ancestorTitles,      
        // Hierarquia de describes
        failureMessages: assertion.failureMessages,    
        // Mensagens de erro (se houver)
        failureDetails: assertion.failureDetails,      
        // Detalhes do erro (se houver)
        numPassingAsserts: assertion.numPassingAsserts,
        // Número de asserts que passaram
        meta: metaMap[assertion.fullName] || null,     
        // Metadados customizados (se houver)
        resumoResultado: resumoMap[assertion.fullName] || null
        // Resumo do resultado (se houver)
      });
    });
  }

  /**
    * onRunComplete
    * Chamado pelo Jest após a execução de todos os testes.
    * @param {Object} contexts - Contextos de execução (não utilizado aqui).
    * @param {Object} results - Resultados agregados de todos os testes.
    * @return {void}
    * Salva o relatório detalhado em formato JSON no arquivo especificado.
    * Inclui informações padrão do Jest e o array de resultados detalhados.
   */
  onRunComplete(contexts, results) {
    console.log('DEBUG success:', {
      numFailedTests: results.numFailedTests,
      numRuntimeErrorTestSuites: results.numRuntimeErrorTestSuites,
      numPassedTests: results.numPassedTests,
      numPendingTests: results.numPendingTests,
      numTotalTests: results.numTotalTests
    });
    const validTests = results.numTotalTests - results.numPendingTests || 1;
    const successRate = results.numPassedTests / validTests;
    console.log('DEBUG validTests:', validTests, 'successRate:', successRate);
    const customSuccess = results.numFailedTests === 0 && results.numRuntimeErrorTestSuites === 0 && successRate === 1;
    console.log('DEBUG customSuccess:', customSuccess);

    const report = {
      generatedAt: new Date().toISOString(),
      ...results,
      success: customSuccess,
      tests: this.results
    };
    fs.writeFileSync(this.outputFile, JSON.stringify(report, null, 2));
    console.log(`✅ Relatório detalhado salvo em ${this.outputFile}`);
  }
}

export default MetaReporter;