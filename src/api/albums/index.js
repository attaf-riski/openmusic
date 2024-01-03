const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {service, songService, validator}) => {
    const albumsHandler = new AlbumsHandler(service, songService, validator);
    server.route(routes(albumsHandler));
  },
};
