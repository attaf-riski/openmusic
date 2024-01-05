const routes = (handler) => [
  {
    method: 'GET',
    path: '/playlists/{playlistId}/activities',
    handler: (request, h) => handler.getPlaylistActivitiesHandler(request, h),
    options: {
      auth: 'openmusic_jwt',
    },
  },
];

module.exports = routes;
