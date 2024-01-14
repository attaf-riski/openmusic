/* eslint-disable max-len */
require('dotenv').config();

const ClientError = require('./exceptions/ClientError');
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

// albums
const AlbumsValidator = require('./validator/albums');
const AlbumsService = require('./services/postgree/AlbumsService');

// songs
const SongsValidator = require('./validator/songs');
const SongsService = require('./services/postgree/SongsService');
const albums = require('./api/albums');
const songs = require('./api/songs');

// playlists
const PlaylistsValidator = require('./validator/playlists');
const PlaylistService = require('./services/postgree/PlaylistsService');
const playlists = require('./api/playlists');

// users
const users = require('./api/users');
const UsersService = require('./services/postgree/UserService');
const UsersValidator = require('./validator/users');

// playlistsongs
const playlistsongs = require('./api/playlistsongs');
const PlaylistSongService = require('./services/postgree/PlaylistSongService');
const playlistsongsValidator = require('./validator/playlistsongs');
const playlistActivities = require('./api/playlistactivities');
const PlaylistActivitiesService = require('./services/postgree/PlaylistActivitiesService');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgree/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgree/CollaborationsService');
const collaborationsValidator = require('./validator/collaborations');

// uploads
const uploads = require('./api/uploads');
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// Exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// User Album Likes
const userAlbumLikes = require('./api/useralbumlikes');
const UserAlbumLikesService = require('./services/postgree/UserAlbumLikes');

// cache service
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService();
  const songsService = new SongsService(cacheService);
  const usersService = new UsersService();
  const userAlbumLikesService = new UserAlbumLikesService(cacheService);
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService(cacheService);
  const playlistsService = new PlaylistService(collaborationsService, cacheService);
  const playlistsongsService = new PlaylistSongService();
  const playlistActivitiesService = new PlaylistActivitiesService(cacheService);
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploads/file/covers'));
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
    {
      plugin: Inert,
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
  {
    plugin: _exports,
    options: {
      service: ProducerService,
      playlistsService,
      validator: ExportsValidator,
    },
  },
  {
    plugin: uploads,
    options: {
      service: storageService,
      albumsService,
      validator: UploadsValidator,
    },
  },
  {
    plugin: userAlbumLikes,
    options: {
      service: userAlbumLikesService,
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
      console.log(response);
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
