/* eslint-disable max-len */
require('dotenv').config();

const ClientError = require('./exceptions/ClientError');
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const AlbumsValidator = require('./validator/albums');
const AlbumsService = require('./services/postgree/AlbumsService');
const SongsValidator = require('./validator/songs');
const SongsService = require('./services/postgree/SongsService');
const albums = require('./api/albums');
const songs = require('./api/songs');

const PlaylistsValidator = require('./validator/playlists');
const PlaylistService = require('./services/postgree/PlaylistsService');
const playlists = require('./api/playlists');

const users = require('./api/users');
const UsersService = require('./services/postgree/UserService');
const UsersValidator = require('./validator/users');

const playlistsongs = require('./api/playlistsongs');
const PlaylistSongService = require('./services/postgree/PlaylistSongService');
const playlistsongsValidator = require('./validator/playlistsongs');

const playlistActivities = require('./api/playlistactivities');
const PlaylistActivitiesService = require('./services/postgree/PlaylistActivitiesService');

const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgree/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgree/CollaborationsService');
const collaborationsValidator = require('./validator/collaborations');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistService(collaborationsService);
  const playlistsongsService = new PlaylistSongService();
  const playlistActivitiesService = new PlaylistActivitiesService();
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // mendefinisikan strategy autentikasi jwt
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([{
    plugin: albums,
    options: {
      service: albumsService,
      songService: songsService,
      validator: AlbumsValidator,
    },
  }, {
    plugin: songs,
    options: {
      service: songsService,
      validator: SongsValidator,
    },
  }, {
    plugin: users,
    options: {
      service: usersService,
      validator: UsersValidator,
    },
  },
  {
    plugin: authentications,
    options: {
      authenticationsService,
      usersService,
      tokenManager: TokenManager,
      validator: AuthenticationsValidator,
    },
  },
  {
    plugin: playlists,
    options: {
      service: playlistsService,
      songService: songsService,
      validator: PlaylistsValidator,
    },
  },
  {
    plugin: playlistsongs,
    options: {
      service: playlistsongsService,
      playlistsService,
      songService: songsService,
      playlistsSongsActivitiesService: playlistActivitiesService,
      validator: playlistsongsValidator,
    },
  },
  {
    plugin: playlistActivities,
    options: {
      service: playlistActivitiesService,
      playlistService: playlistsService,
    },
  },
  {
    plugin: collaborations,
    options: {
      service: collaborationsService,
      playlistsService: playlistsService,
      userService: usersService,
      validator: collaborationsValidator,
    },
  },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const {response} = request;

    if (response instanceof Error) {
      // penanganan client error secara internal.
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!response.isServer) {
        return h.continue;
      }

      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
