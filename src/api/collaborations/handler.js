/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

class CollaborationsHandler {
  constructor(service, playlistService, userService, validator) {
    this._service = service;
    this._playlistService = playlistService;
    this._userService = userService;
    this._validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const {id: credentialId} = request.auth.credentials;
    const {playlistId, userId} = request.payload;
    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    await this._userService.getUserById(userId);
    const collaborationId = await this._service.addCollaboration(playlistId, userId);
    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const {id: credentialId} = request.auth.credentials;
    const {playlistId, userId} = request.payload;

    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);
    await this._service.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
