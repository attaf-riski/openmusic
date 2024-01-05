const CollaborationsHandler = require('./handler');
const routes = require('./routes');

/* eslint-disable max-len */
module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, {service, playlistsService, userService, validator}) => {
    const collaborationsHandler = new CollaborationsHandler(
        service, playlistsService, userService, validator,
    );
    server.route(routes(collaborationsHandler));
  },
};
