const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Skilled Professional Service Marketplace API',
      version: '1.0.0',
      description: `
REST API and WebSocket documentation for Skilled Professional Service Marketplace.

### User Roles
- **ADMIN**: Manages categories, verifies professional inquiries (Aadhaar & documents), views customers and moderates chats.
- **PROFESSIONAL**: Registers with mandatory Aadhaar, awaits Admin review. Once approved, can receive messages from customers.
- **CUSTOMER**: Searches approved professionals, views verified profiles, chats real-time via Socket.IO.

### Authentication
Bearer JWT token in Authorization header:
\`Authorization: Bearer <token>\`
      `,
      contact: {
        name: 'API Support Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token generated upon login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'PROFESSIONAL', 'CUSTOMER'] },
            location: { type: 'string' },
            profilePhoto: { type: 'string' },
            isActive: { type: 'boolean' },
            loginAllowed: { type: 'boolean' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            isActive: { type: 'boolean' },
            professionalCount: { type: 'number' }
          }
        },
        ProfessionalProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            profilePhoto: { type: 'string' },
            experience: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            location: { type: 'string' },
            verificationStatus: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] },
            isActive: { type: 'boolean' }
          }
        },
        Inquiry: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] },
            notes: { type: 'string' },
            rejectionReason: { type: 'string' },
            reviewedAt: { type: 'string', format: 'date-time' }
          }
        },
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            customerId: { $ref: '#/components/schemas/User' },
            professionalId: { $ref: '#/components/schemas/User' },
            lastMessage: { type: 'string' },
            lastMessageAt: { type: 'string', format: 'date-time' },
            unreadCountCustomer: { type: 'number' },
            unreadCountProfessional: { type: 'number' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            conversationId: { type: 'string' },
            senderId: { type: 'string' },
            receiverId: { type: 'string' },
            message: { type: 'string' },
            messageType: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE'] },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: {
      '/api/auth/register/customer': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new Customer',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'phone', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    password: { type: 'string' },
                    location: { type: 'string' },
                    profilePhoto: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Customer created successfully' },
            400: { description: 'Validation error' }
          }
        }
      },
      '/api/auth/register/professional': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new Professional with mandatory Aadhaar & verification documents',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'phone', 'password', 'categoryId', 'dateOfBirth', 'address', 'location', 'experience', 'aadhaar'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    password: { type: 'string' },
                    categoryId: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date' },
                    address: { type: 'string' },
                    location: { type: 'string' },
                    experience: { type: 'number' },
                    skills: { type: 'string', description: 'Comma separated or JSON array' },
                    description: { type: 'string' },
                    profilePhoto: { type: 'string', format: 'binary' },
                    aadhaar: { type: 'string', format: 'binary', description: 'MANDATORY Aadhaar Document (PDF/Image)' },
                    pan: { type: 'string', format: 'binary' },
                    passport: { type: 'string', format: 'binary' },
                    drivingLicense: { type: 'string', format: 'binary' },
                    professionalCertificate: { type: 'string', format: 'binary' },
                    otherDoc: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Registration queued for Admin verification (PENDING)' },
            400: { description: 'Missing mandatory fields or missing Aadhaar' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User Login with strict backend verification checks',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    role: { type: 'string', enum: ['ADMIN', 'PROFESSIONAL', 'CUSTOMER'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
            403: { description: 'Forbidden: Account pending, under review, or rejected' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user info',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Authenticated user profile' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/categories': {
        get: {
          tags: ['Categories'],
          summary: 'List categories (public gets active ones, admin can pass all=true)',
          parameters: [
            { name: 'all', in: 'query', schema: { type: 'boolean' }, description: 'Include inactive categories' }
          ],
          responses: { 200: { description: 'List of categories' } }
        },
        post: {
          tags: ['Categories'],
          summary: 'Create a new category (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    icon: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Category created' },
            403: { description: 'Admin required' }
          }
        }
      },
      '/api/categories/{id}': {
        get: {
          tags: ['Categories'],
          summary: 'Get category by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category details' } }
        },
        put: {
          tags: ['Categories'],
          summary: 'Update category (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    icon: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Category updated' } }
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete category if no professionals attached (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category deleted' } }
        }
      },
      '/api/categories/{id}/status': {
        patch: {
          tags: ['Categories'],
          summary: 'Toggle category active status (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { isActive: { type: 'boolean' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Status updated' } }
        }
      },
      '/api/search/professionals': {
        get: {
          tags: ['Search'],
          summary: 'Search approved professionals by category, location, and experience',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category ID' },
            { name: 'location', in: 'query', schema: { type: 'string' }, description: 'City/Area' },
            { name: 'minExperience', in: 'query', schema: { type: 'number' } },
            { name: 'maxExperience', in: 'query', schema: { type: 'number' } },
            { name: 'query', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: { 200: { description: 'List of approved professionals' } }
        }
      },
      '/api/professionals': {
        get: {
          tags: ['Professionals'],
          summary: 'List all professionals (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] } },
            { name: 'categoryId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'List of professionals' } }
        }
      },
      '/api/professionals/{id}': {
        get: {
          tags: ['Professionals'],
          summary: 'Get professional profile (Customer gets safe view, Admin gets full audit details)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Professional profile' } }
        }
      },
      '/api/professionals/me': {
        get: {
          tags: ['Professionals'],
          summary: 'Get logged in professional own profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Own profile' } }
        },
        put: {
          tags: ['Professionals'],
          summary: 'Update own profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Updated profile' } }
        }
      },
      '/api/inquiries': {
        get: {
          tags: ['Inquiries'],
          summary: 'List registration inquiries for verification (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] } }
          ],
          responses: { 200: { description: 'List of inquiries' } }
        }
      },
      '/api/inquiries/{id}': {
        get: {
          tags: ['Inquiries'],
          summary: 'Get inquiry details with full application & documents (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Inquiry details' } }
        }
      },
      '/api/inquiries/{id}/review': {
        patch: {
          tags: ['Inquiries'],
          summary: 'Mark inquiry as UNDER_REVIEW (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Inquiry status set to UNDER_REVIEW' } }
        }
      },
      '/api/inquiries/{id}/approve': {
        patch: {
          tags: ['Inquiries'],
          summary: 'Approve professional inquiry (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Approved successfully, login enabled' } }
        }
      },
      '/api/inquiries/{id}/reject': {
        patch: {
          tags: ['Inquiries'],
          summary: 'Reject professional inquiry with mandatory reason (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rejectionReason'],
                  properties: {
                    rejectionReason: { type: 'string' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Inquiry rejected' } }
        }
      },
      '/api/documents/{id}': {
        get: {
          tags: ['Documents'],
          summary: 'Securely view/download identity document file (Admin Only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'File binary stream' },
            403: { description: 'Access Denied: Private document' }
          }
        }
      },
      '/api/conversations': {
        get: {
          tags: ['Conversations'],
          summary: 'List user conversations (or all conversations for Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of conversations' } }
        },
        post: {
          tags: ['Conversations'],
          summary: 'Create or get existing conversation with approved professional',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['professionalUserId'],
                  properties: { professionalUserId: { type: 'string' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Conversation object' } }
        }
      },
      '/api/conversations/{id}/messages': {
        get: {
          tags: ['Messages'],
          summary: 'Get message history of a conversation',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'List of messages' } }
        }
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get dashboard statistics (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Dashboard metrics' } }
        }
      },
      '/api/admin/customers': {
        get: {
          tags: ['Admin'],
          summary: 'List all registered customers (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of customers' } }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
