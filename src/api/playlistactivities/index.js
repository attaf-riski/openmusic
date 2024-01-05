/* eslint-disable max-len */
const PlaylistActivitiesHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlistactivities',
  version: '1.0.0',
  register: async (server, {service, playlistService}) => {
    const playlistActivitiesHandler = new PlaylistActivitiesHandler(service, playlistService);
    server.route(routes(playlistActivitiesHandler));
  },
};
