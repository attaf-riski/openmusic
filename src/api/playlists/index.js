const PlaylistHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, {service, songService, validator}) => {
    // eslint-disable-next-line max-len
    const playlistHandler = new PlaylistHandler(service, songService, validator);
    server.route(routes(playlistHandler));
  },
};
