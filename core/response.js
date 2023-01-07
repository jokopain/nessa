class ApiResponse {

    constructor(body, statusCode){
        this.body = body;
        this.statusCode = statusCode;
    }

    create(body, statusCode){
        return new ApiResponse({...this.body, ...body}, statusCode || this.statusCode)
    }

}


module.exports = ApiResponse