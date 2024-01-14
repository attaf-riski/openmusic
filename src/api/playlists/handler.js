/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, songService, validator) {
    this._service = service;
    this._validator = validator;
    this._songService = songService;

    autoBind(this); // mem-bind nilai this untuk seluruh method sekaligus
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const {name} = request.payload;
    const {id} = request.auth.credentials;
    const playlistId = await this._service.addPlaylist(name, id);
    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;
    const data = await this._service.getPlaylists(credentialId);

    const playlists = data.playlists;

    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
    response.header('X-Data-Source', data.source);
    return response;
  }

  async deletePlaylistHandler(request) {
    const {playlistId} = request.params;
    const {id: credentialId} = request.auth.credentials;
    await this._service.verifyPlaylistOwner(playlistId, credentialId);
    await this._service.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }
}

module.exports = PlaylistsHandler;
