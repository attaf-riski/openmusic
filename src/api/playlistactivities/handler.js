/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const autoBind = require('auto-bind');

class PlaylistActivitiesHandler {
  constructor(service, playlistService ) {
    this._service = service;
    this._playlistService = playlistService;

    autoBind(this); // mem-bind nilai this untuk seluruh method sekaligus
  }

  async postPlaylistActivityHandler(request, h) {
    this._validator.validatePlaylistActivityPayload(request.payload);
    const {id: credentialId} = request.auth.credentials;
    const {playlistId} = request.params;
    const {songId} = request.payload;

    await this._service.verifyPlaylistOwner(playlistId, credentialId);
    await this._service.addSongToPlaylist(playlistId, songId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistActivitiesHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;
    const {playlistId} = request.params;
    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    const resultBuffer = await this._service.getPlaylistActivities(playlistId);

    const data = resultBuffer.data;


    const response = h.response({
      status: 'success',
      data,
    });

    response.header('X-Data-Source', resultBuffer.source);

    return response;
  }
}

module.exports = PlaylistActivitiesHandler;
