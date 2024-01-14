/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(service, playlistsService, validator) {
    this._service = service;
    this._playlistsService = playlistsService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);

    const {playlistId} = request.params;

    await this._playlistsService.verifyPlaylistOwner(playlistId, request.auth.credentials.id);
    await this._playlistsService.getPlaylistById(playlistId);
    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };


    await this._service.sendMessage('export:playlists', JSON.stringify(message));
    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
