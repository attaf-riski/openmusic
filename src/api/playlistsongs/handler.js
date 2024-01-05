/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

class PlaylistsongsHandler {
  constructor(service, playlistsService, songService, playlistsSongsActivitiesService, validator) {
    this._service = service;
    this._playlistsService = playlistsService;
    this._validator = validator;
    this._songService = songService;
    this._playlistsSongsActivitiesService = playlistsSongsActivitiesService;

    this.postPlaylistsongHandler = this.postPlaylistsongHandler.bind(this);
    this.getPlaylistsongByIdHandler = this.getPlaylistsongByIdHandler.bind(this);
    this.deletePlaylistsongHandler = this.deletePlaylistsongHandler.bind(this);
  }

  async postPlaylistsongHandler(request, h) {
    this._validator.validatePlaylistsongPayload(request.payload);
    const {id: credentialId} = request.auth.credentials;
    const {songId} = request.payload;
    const {playlistId} = request.params;
    await this._songService.getSongById(songId);
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const playlistsongId = await this._service.addPlaylistsong(playlistId, songId);
    await this._playlistsSongsActivitiesService.activitiesAddSongPlaylist(
        playlistId,
        songId,
        credentialId,
    );

    const response = h.response({
      status: 'success',
      data: {
        playlistsongId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsongByIdHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;
    const {playlistId} = request.params;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const playlistData = await this._playlistsService.getPlaylistById(playlistId);
    const playlistsongs = await this._service.getSongFromPlaylist(playlistId);

    const playlistsongsProps = playlistsongs.map((playlistsong) => ({
      id: playlistsong.id,
      title: playlistsong.title,
      performer: playlistsong.performer,
    }));

    return {
      status: 'success',
      data: {
        playlist: {
          id: playlistData.id,
          name: playlistData.name,
          username: playlistData.username,
          songs: playlistsongsProps,
        },
      },
    };
  }

  async deletePlaylistsongHandler(request, h) {
    this._validator.validatePlaylistsongPayload(request.payload);
    const {id: credentialId} = request.auth.credentials;
    const {songId} = request.payload;
    const {playlistId} = request.params;
    await this._songService.getSongById(songId);
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deleteSongFromPlaylistById(songId, playlistId);
    await this._playlistsSongsActivitiesService.activitiesDeleteSongPlaylist(
        playlistId,
        songId,
        credentialId,
    );

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = PlaylistsongsHandler;
