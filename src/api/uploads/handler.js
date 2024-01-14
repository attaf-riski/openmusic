/* eslint-disable require-jsdoc */

const autoBind = require('auto-bind');

class UploadsHandler {
  constructor(service, albumsService, validator) {
    this._service = service;
    this._validator = validator;
    this._albumsService = albumsService;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    const {cover} = request.payload;
    const {id} = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);
    const filename = await this._service.writeFile(cover, cover.hapi);
    this._albumsService.editCoverUrlById(id, `http://${process.env.HOST}:${process.env.PORT}/upload/covers/${filename}`);
    const response = h.response({
      'status': 'success',
      'message': 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;

