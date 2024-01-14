const autoBind = require('auto-bind');

/* eslint-disable require-jsdoc */
class UserAlbumLikesHandler {
  constructor(service) {
    this._service = service;

    autoBind(this);
  }

  async postLikeAlbumByIdHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;
    const {id} = request.params;
    await this._service.addLikeAlbum(credentialId, id);
    const response = h.response({
      status: 'success',
      message: 'Like berhasil ditambahkan',
    });
    response.code(201);
    return response;
  }

  async deleteLikeAlbumByIdHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;
    const {id} = request.params;
    await this._service.deleteLikeAlbum(credentialId, id);
    const response = h.response({
      status: 'success',
      message: 'Like berhasil dihapus',
    });
    return response;
  }

  async getLikeAlbumByIdHandler(request, h) {
    const {id} = request.params;
    const data = await this._service.getLikeAlbum(id);
    const likes = data.like;
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.header('X-Data-Source', data.source);
    response.code(200);
    return response;
  }
}

module.exports = UserAlbumLikesHandler;
