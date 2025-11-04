// backend/utils/handler/apiANAErrorHandler.js

const HIDROWEB_AUTH_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/OAUth/v1';

class ApiError {
    constructor(errorType, code, message, details = {}) {
        this.error = {
            type: errorType,
            code,
            message,
            details: {
                api: 'ANA HidroWeb',
                ...details
            },
            response_data: {}
        };
    }

    withSystemMessage(systemMessage) {
        this.error.response_data.system_message = systemMessage;
        return this;
    }

    withResponseData(data) {
        this.error.response_data = { ...this.error.response_data, ...data };
        return this;
    }

    toJSON() {
        return this.error;
    }
}

const errorTypes = {
    AUTH: {
        INVALID_CREDENTIALS: (axiosError) => new ApiError(
            'AuthError',
            401,
            'Identificador e/ou Senha Inválidos. Verifique!',
            {
                endpoint: HIDROWEB_AUTH_URL,
                method: 'GET',
                timestamp: new Date().toISOString()
            }
        ).withSystemMessage(axiosError.message)
            .withResponseData({
                status: 'UNAUTHORIZED'
            }),

        MISSING_TOKEN: () => new ApiError(
            'AuthError',
            500,
            'Token de autenticação não retornado pela API'
        ),

        GENERIC: (error) => new ApiError(
            'AuthError',
            500,
            'Falha no processo de autenticação',
            { originalError: error.message }
        )
    },

    API: {
        TIMEOUT: () => new ApiError(
            'ApiError',
            408,
            'Timeout ao conectar com o serviço ANA'
        ),

        UNEXPECTED: (error) => new ApiError(
            'ApiError',
            500,
            'Erro inesperado na comunicação com a API ANA'
        ).withSystemMessage(error.message)
    }
};

function handleAuthError(error) {
    if (error.response) {
        // Erros com resposta da API
        switch (error.response.status) {
            case 401:
                return errorTypes.AUTH.INVALID_CREDENTIALS(error);
            case 408:
                return errorTypes.API.TIMEOUT();
            default:
                return errorTypes.API.UNEXPECTED(error);
        }
    } else if (error.request) {
        // Erros sem resposta (timeout, etc)
        return errorTypes.API.TIMEOUT();
    } else {
        // Erros de configuração ou outros
        return errorTypes.AUTH.GENERIC(error);
    }
}

export {
    ApiError,
    errorTypes,
    handleAuthError
};