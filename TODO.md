# TODO List

This TODO list tracks the development progress of the VRC Class Reunion Discord Bot based on the project specifications.

## Phase 1: MVP (Minimum Viable Product)

### Milestone 1.1: Project Foundation Setup (Week 1-2)

- [ ] Setup project structure
  - [ ] Initialize Node.js project with TypeScript
  - [ ] Configure package.json with required dependencies
  - [ ] Setup folder structure (src/, spec/, prisma/)
- [ ] Configure TypeScript environment
  - [ ] Create tsconfig.json with strict type checking
  - [ ] Setup ESLint configuration
  - [ ] Setup Prettier for code formatting
  - [ ] Configure ts-node for development
- [ ] Setup Prisma ORM
  - [ ] Install Prisma CLI and client
  - [ ] Initialize Prisma with PostgreSQL provider
  - [ ] Create database schema for Invitation, Participant, and Ticket models
  - [ ] Generate Prisma client
  - [ ] Test database connection
- [ ] Implement environment variable management
  - [ ] Create .env.example file
  - [ ] Setup Zod validation for environment variables
  - [ ] Create env.ts configuration module
- [ ] Implement logging system
  - [ ] Install and configure Winston logger
  - [ ] Setup log levels (error, warn, info, debug)
  - [ ] Create logger utility module
  - [ ] Configure log file rotation
- [ ] Initialize discord.js v14
  - [ ] Install discord.js library
  - [ ] Create Discord bot application
  - [ ] Setup bot token in environment variables
  - [ ] Implement basic bot connection
  - [ ] Test bot online status

### Milestone 1.2: Invitation System - Core Features (Week 3-6)

#### Invitation Creation Feature
- [ ] Implement modal UI
  - [ ] Create button component for "Create Invitation"
  - [ ] Design modal with 11 input fields
  - [ ] Add event name input field
  - [ ] Add start time input field (datetime format)
  - [ ] Add end time input field (datetime format)
  - [ ] Add world name input field
  - [ ] Add world link input field (URL format)
  - [ ] Add tag/category selection
  - [ ] Add description text area
  - [ ] Add instance type selection (group/friend/friendplus/public)
  - [ ] Add VRChat profile URL field
  - [ ] Add max participants number field
- [ ] Implement validation using Zod
  - [ ] Validate datetime format (ISO 8601)
  - [ ] Validate URL format for world link
  - [ ] Validate URL format for VRChat profile
  - [ ] Validate numeric range for max participants (1-80)
  - [ ] Validate start time < end time
  - [ ] Display specific error messages for validation failures
- [ ] Implement forum thread auto-creation
  - [ ] Create new thread in forum channel
  - [ ] Set thread title based on event name
  - [ ] Apply appropriate tags based on category
- [ ] Implement embed message generation
  - [ ] Create embed with invitation details
  - [ ] Format datetime displays
  - [ ] Add participant count display (0/max)
  - [ ] Add action buttons row
- [ ] Implement database save operation
  - [ ] Save invitation data to database via Prisma
  - [ ] Handle database errors gracefully
  - [ ] Return success/failure status

#### Participation Management Feature
- [ ] Implement "Join" button
  - [ ] Handle button interaction
  - [ ] Validate user not already joined
  - [ ] Check capacity not exceeded
  - [ ] Add participant to database
  - [ ] Update embed message with new participant
  - [ ] Send confirmation ephemeral message
- [ ] Implement "Interested" button
  - [ ] Handle button interaction
  - [ ] Validate user not already interested
  - [ ] Add participant with interested status
  - [ ] Update embed message with interested user
  - [ ] Send confirmation ephemeral message
- [ ] Implement "Cancel Participation" button
  - [ ] Handle button interaction
  - [ ] Validate user is currently participating
  - [ ] Remove participant from database
  - [ ] Update embed message
  - [ ] Send confirmation ephemeral message
- [ ] Implement capacity auto-disable
  - [ ] Check if participant count reached max
  - [ ] Disable join button when full
  - [ ] Update status to "full"
  - [ ] Re-enable button when someone cancels
- [ ] Implement dynamic embed update
  - [ ] Fetch current participants from database
  - [ ] Regenerate participant list in embed
  - [ ] Update embed message in Discord
  - [ ] Handle concurrent updates safely

#### Status Management
- [ ] Implement forum tag auto-assignment
  - [ ] Create mapping between status and forum tags
  - [ ] Auto-apply "Recruiting" tag on creation
  - [ ] Auto-apply "Full" tag when capacity reached
  - [ ] Auto-apply "Completed" tag after event end time
  - [ ] Auto-apply "Cancelled" tag when host cancels
- [ ] Implement automatic status updates
  - [ ] Schedule periodic check for event completion
  - [ ] Update invitation status in database
  - [ ] Update forum thread tags

### Milestone 1.3: Invitation System - Host Features (Week 7-8)

#### Edit Invitation Feature
- [ ] Implement permission check
  - [ ] Validate interaction user is the host
  - [ ] Show error message for non-host users
- [ ] Implement edit modal
  - [ ] Pre-fill modal with current invitation data
  - [ ] Allow editing of all mutable fields
  - [ ] Validate edited data
- [ ] Implement database update
  - [ ] Update invitation record in database
  - [ ] Preserve original creation timestamp
  - [ ] Update updatedAt timestamp
- [ ] Implement embed message update
  - [ ] Regenerate embed with new data
  - [ ] Update message in Discord
- [ ] Post update notification in thread
  - [ ] Create message about what was changed
  - [ ] Mention all participants
  - [ ] Timestamp the update

#### Cancel Invitation Feature
- [ ] Implement confirmation dialog
  - [ ] Show warning message about cancellation
  - [ ] Require explicit confirmation
  - [ ] Allow cancellation of confirmation
- [ ] Implement status change to cancelled
  - [ ] Update database status to "cancelled"
  - [ ] Update forum tag to "Cancelled"
- [ ] Disable all buttons
  - [ ] Update embed message components
  - [ ] Set all buttons to disabled state
- [ ] Send DM notifications to participants (Optional)
  - [ ] Fetch all participants from database
  - [ ] Send cancellation notice via DM
  - [ ] Handle DM sending failures gracefully
- [ ] Archive forum thread
  - [ ] Lock the thread
  - [ ] Archive the thread

### Milestone 1.4: Group Instance Management (Week 9-10)

#### Staff Notification Feature
- [ ] Implement group instance detection
  - [ ] Check if instanceType is "group"
  - [ ] Trigger notification on group invitation creation
- [ ] Post notification in staff channel
  - [ ] Create embed with invitation summary
  - [ ] Include event details
  - [ ] Show number of participants
  - [ ] Add link to original invitation thread
- [ ] Add staff assignment button
  - [ ] Create "Assign to Me" button
  - [ ] Include invitation ID in button custom ID

#### Staff Assignment Feature
- [ ] Implement first-come-first-served assignment
  - [ ] Handle button interaction
  - [ ] Check if already assigned
  - [ ] Show error if already assigned to another staff
- [ ] Prevent duplicate assignments
  - [ ] Use database transaction for atomic assignment
  - [ ] Update invitation with staff ID and name
- [ ] Display assigned staff on invitation
  - [ ] Update invitation embed
  - [ ] Add staff name field to embed
  - [ ] Disable assignment button
- [ ] Send DM to assigned staff
  - [ ] Notify staff of successful assignment
  - [ ] Include invitation details
  - [ ] Provide next steps instructions

#### Instance Information Input Feature
- [ ] Implement input modal
  - [ ] Create modal for instance link input
  - [ ] Add instance link text field
  - [ ] Add optional notes field
  - [ ] Validate URL format
- [ ] Display instance info on invitation
  - [ ] Update invitation embed with instance link
  - [ ] Show instance info prominently
- [ ] Send DM notifications to participants
  - [ ] Fetch all joined participants
  - [ ] Send instance link via DM
  - [ ] Include event reminder
  - [ ] Handle DM sending failures

### Milestone 1.5: Ticket System (Week 11)

#### Ticket Creation Feature
- [ ] Implement ticket creation button
  - [ ] Create button in designated channel
  - [ ] Handle button interaction
- [ ] Show category selection modal
  - [ ] Add category dropdown (Question/Trouble/Other)
  - [ ] Add description text area
  - [ ] Validate input
- [ ] Create private channel
  - [ ] Generate unique channel name
  - [ ] Set channel permissions (user + staff only)
  - [ ] Place channel in ticket category
- [ ] Save ticket to database
  - [ ] Store ticket with channel ID as primary key
  - [ ] Record user ID, category, and timestamp
- [ ] Post initial message in ticket channel
  - [ ] Welcome message for user
  - [ ] Include ticket category and description
  - [ ] Add close button

#### Ticket Close Feature
- [ ] Implement close button
  - [ ] Handle close button interaction
  - [ ] Show confirmation dialog
- [ ] Update ticket status in database
  - [ ] Set status to "closed"
  - [ ] Record closedAt timestamp
- [ ] Archive or delete channel
  - [ ] Option to delete immediately
  - [ ] Option to archive for record keeping
  - [ ] Send confirmation message before deletion

### Milestone 1.6: Testing and Bug Fixes (Week 12)

- [ ] Unit testing
  - [ ] Write tests for validation functions
  - [ ] Write tests for database operations
  - [ ] Write tests for business logic services
  - [ ] Achieve 80%+ code coverage
- [ ] Integration testing
  - [ ] Test invitation creation flow end-to-end
  - [ ] Test participation management flow
  - [ ] Test staff assignment flow
  - [ ] Test ticket creation and closing flow
- [ ] Bug fixing
  - [ ] Fix all critical bugs
  - [ ] Fix high-priority bugs
  - [ ] Document known minor issues
- [ ] Performance testing
  - [ ] Test bot under concurrent user interactions
  - [ ] Optimize database queries
  - [ ] Test rate limit handling
- [ ] User acceptance testing
  - [ ] Deploy to test server
  - [ ] Conduct testing with sample users
  - [ ] Gather feedback and iterate

## Phase 2: Advanced Features (Month 4-5)

### Reminder System
- [ ] Implement event reminder scheduler
  - [ ] Setup cron job for periodic checks
  - [ ] Query upcoming events (within 1 hour)
  - [ ] Send DM reminders to participants
  - [ ] Include event details and world link
- [ ] Implement customizable reminder timing
  - [ ] Allow hosts to set reminder times
  - [ ] Support multiple reminder intervals
  - [ ] Store reminder preferences in database

### Search and Filter System
- [ ] Implement invitation search command
  - [ ] Create slash command for search
  - [ ] Support search by event name
  - [ ] Support search by tag/category
  - [ ] Support search by date range
  - [ ] Display paginated results
- [ ] Implement filter by status
  - [ ] Filter recruiting invitations
  - [ ] Filter completed invitations
  - [ ] Filter cancelled invitations

### Statistics and Analytics
- [ ] Implement event statistics
  - [ ] Track total events created
  - [ ] Track total participants
  - [ ] Calculate average participation rate
  - [ ] Track most popular event types
- [ ] Create statistics dashboard command
  - [ ] Display server-wide statistics
  - [ ] Display personal statistics for users
  - [ ] Include charts and visualizations

## Phase 3: Optimization and Launch (Month 6)

### Performance Optimization
- [ ] Database optimization
  - [ ] Analyze and optimize slow queries
  - [ ] Add database indexes where needed
  - [ ] Implement connection pooling
- [ ] Cache implementation
  - [ ] Cache frequently accessed data
  - [ ] Implement cache invalidation strategy
  - [ ] Use Redis for distributed caching
- [ ] Rate limiting
  - [ ] Implement user-level rate limiting
  - [ ] Add cooldown for invitation creation
  - [ ] Handle Discord API rate limits gracefully

### Security Hardening
- [ ] Input sanitization
  - [ ] Sanitize all user inputs
  - [ ] Prevent SQL injection
  - [ ] Prevent XSS in embed messages
- [ ] Permission validation
  - [ ] Verify bot permissions in all channels
  - [ ] Validate user permissions for all actions
  - [ ] Implement role-based access control
- [ ] Error handling
  - [ ] Catch and log all errors
  - [ ] Display user-friendly error messages
  - [ ] Prevent error information leakage

### Monitoring and Logging
- [ ] Setup application monitoring
  - [ ] Implement health check endpoint
  - [ ] Monitor bot uptime
  - [ ] Track error rates
  - [ ] Alert on critical failures
- [ ] Enhance logging
  - [ ] Log all user interactions
  - [ ] Log all database operations
  - [ ] Implement log aggregation
  - [ ] Create audit trail for admin actions

### Documentation
- [ ] Technical documentation
  - [ ] API documentation
  - [ ] Database schema documentation
  - [ ] Architecture diagrams
  - [ ] Deployment guide
- [ ] User documentation
  - [ ] User guide for members
  - [ ] Admin guide for staff
  - [ ] FAQ document
  - [ ] Troubleshooting guide

### Deployment Preparation
- [ ] Production environment setup
  - [ ] Setup PostgreSQL production database
  - [ ] Configure production environment variables
  - [ ] Setup process manager (PM2)
  - [ ] Configure reverse proxy (if needed)
- [ ] Migration strategy
  - [ ] Plan data migration from test to production
  - [ ] Create database backup procedure
  - [ ] Test rollback procedure
- [ ] Launch preparation
  - [ ] Conduct final testing
  - [ ] Prepare launch announcement
  - [ ] Train staff members
  - [ ] Monitor initial usage closely

## Phase 4: Evolution (Month 7+)

### Future Enhancements
- [ ] VRChat API integration
  - [ ] Fetch world information automatically
  - [ ] Validate VRChat profile URLs
  - [ ] Display user online status
- [ ] Advanced notification system
  - [ ] Webhook notifications
  - [ ] Email notifications
  - [ ] Mobile push notifications
- [ ] Multi-language support
  - [ ] Internationalization setup
  - [ ] Japanese localization
  - [ ] English localization
- [ ] Community feature requests
  - [ ] Collect and prioritize user feedback
  - [ ] Implement highly requested features
  - [ ] Continuously improve user experience

## Maintenance Tasks

### Regular Maintenance
- [ ] Weekly dependency updates
- [ ] Monthly security audit
- [ ] Quarterly performance review
- [ ] Annual architecture review

### Incident Response
- [ ] Monitor error logs daily
- [ ] Respond to critical issues within 1 hour
- [ ] Post-mortem for major incidents
- [ ] Update runbooks based on incidents
