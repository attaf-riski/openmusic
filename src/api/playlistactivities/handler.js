/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
class PlaylistActivitiesHandler {
  constructor(service, playlistService ) {
    this._service = service;
    this._playlistService = playlistService;

    this.postPlaylistActivityHandler = this.postPlaylistActivityHandler.bind(this);
    this.getPlaylistActivitiesHandler = this.getPlaylistActivitiesHandler.bind(this);
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
    const data = await this._service.getPlaylistActivities(playlistId);

    const result = {
      status: 'success',
      data,
    };

    return result;
  }
}

module.exports = PlaylistActivitiesHandler;
