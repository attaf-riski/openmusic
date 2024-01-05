/* eslint-disable max-len */
const PlaylistsongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlistsongs',
  version: '1.0.0',
  register: async (server, {service, playlistsService, songService, playlistsSongsActivitiesService, validator}) => {
    const playlistsongsHandler = new PlaylistsongsHandler(
        service, playlistsService, songService, playlistsSongsActivitiesService, validator,
    );
    server.route(routes(playlistsongsHandler));
  },
};
