class RequestData {
    data = {};
    rawRequest;
    rawResponse;
    rawNext;
    constructor(req, res, next){
        this.rawResponse = res;
        this.rawRequest = req;
        this.rawNext = next;
    }
}

exports.RequestData = RequestData