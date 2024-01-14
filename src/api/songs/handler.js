/* eslint-disable require-jsdoc */
const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this); // mem-bind nilai this untuk seluruh method sekaligus
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const songId = await this._service.addSong(request.payload);

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });

    response.code(201);

    return response;
  }

  async getSongsHandler(request, h) {
    const data = await this._service.getSongs(request.query);
    const songs = data.songs;
    const response = h.response({
      status: 'success',
      data: {
        songs,
      },
    });

    response.header('X-Data-Source', data.source);

    return response;
  }

  async getSongByIdHandler(request, h) {
    const {id} = request.params;
    const data = await this._service.getSongById(id);
    const song = data.song;

    const response = h.response({
      status: 'success',
      data: {
        song,
      },
    });

    response.header('X-Data-Source', data.source);
    return response;
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const {id} = request.params;
    await this._service.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const {id} = request.params;
    await this._service.deleteSongById(id);
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongsHandler;
