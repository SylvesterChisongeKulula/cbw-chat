const fs = require('fs');
const path = require('path');

const structure = {
  'chat-api': {
    'src': {
      'config': {
        'db.js': '',
        'index.js': ''
      },
      'models': {
        'user.model.js': '',
        'chat.model.js': '',
        'message.model.js': ''
      },
      'controllers': {
        'user.controller.js': '',
        'chat.controller.js': ''
      },
      'routes': {
        'user.routes.js': '',
        'chat.routes.js': '',
        'index.js': ''
      },
      'middlewares': {
        'error.middleware.js': ''
      },
      'services': {
        'user.service.js': '',
        'chat.service.js': ''
      },
      'utils': {
        'logger.js': '',
        'helpers.js': ''
      },
      'socket': {
        'handlers.js': '',
        'index.js': ''
      },
      'app.js': ''
    },
    'server.js': '',
    '.env': '',
    '.env.example': '',
    '.gitignore': '',
    'package.json': '',
    'README.md': ''
  }
};

function createDirectoryStructure(basePath, struct) {
  Object.entries(struct).forEach(([key, value]) => {
    const currentPath = path.join(basePath, key);
    
    if (typeof value === 'object') {
      fs.mkdirSync(currentPath, { recursive: true });
      createDirectoryStructure(currentPath, value);
    } else {
      fs.writeFileSync(currentPath, '');
    }
  });
}

createDirectoryStructure('.', structure);