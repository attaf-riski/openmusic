const routes = (handler) => [
  {
    method: 'POST',
    path: '/playlists/{playlistId}/songs',
    handler: (request, h) => handler.postPlaylistsongHandler(request, h),
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'GET',
    path: '/playlists/{playlistId}/songs',
    handler: (request) => handler.getPlaylistsongByIdHandler(request),
    options: {
      auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/playlists/{playlistId}/songs',
    handler: (request) => handler.deletePlaylistsongHandler(request),
    options: {
      auth: 'openmusic_jwt',
    },
  },
];

module.exports = routes;
