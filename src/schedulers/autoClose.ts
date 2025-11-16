import cron from 'node-cron';
import { Client } from 'discord.js';
import { logger } from '../utils/logger';
import { invitationService } from '../services/invitationService';
import { createInvitationEmbed, createInvitationButtons, createHostButtons } from '../utils/embed';

/**
 * Auto-close scheduler for completed invitations
 * Runs every hour to check for events past their end time
 */
export function startAutoCloseScheduler(client: Client): void {
  const schedule = process.env['CRON_AUTO_CLOSE_SCHEDULE'] || '0 * * * *'; // Every hour at :00

  logger.info('Starting auto-close scheduler', { schedule });

  cron.schedule(schedule, async () => {
    try {
      await autoCloseCompletedInvitations(client);
    } catch (error) {
      logger.error('Auto-close scheduler error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });
}

/**
 * Check and close invitations that are past their end time
 */
async function autoCloseCompletedInvitations(client: Client): Promise<void> {
  try {
    const now = new Date();

    // Find all invitations that should be closed
    // Status: recruiting or full, endTime < now
    const invitations = await invitationService.getInvitationsToAutoClose(now);

    if (invitations.length === 0) {
      logger.debug('No invitations to auto-close');
      return;
    }

    logger.info('Auto-closing invitations', { count: invitations.length });

    for (const invitation of invitations) {
      try {
        // Update status to completed
        await invitationService.updateInvitation(invitation.id, {
          status: 'completed',
        });

        // Get thread and update message
        const thread = await client.channels.fetch(invitation.threadId);
        if (thread?.isThread()) {
          const starterMessage = await thread.fetchStarterMessage();

          if (starterMessage) {
            const participants = await invitationService.getParticipants(invitation.id);
            const updatedInvitation = await invitationService.getInvitationById(invitation.id);

            if (updatedInvitation) {
              const embed = createInvitationEmbed(updatedInvitation, participants);
              const count = await invitationService.getParticipantCount(invitation.id);
              const isFull = count.joined >= updatedInvitation.maxParticipants;

              // Create disabled buttons
              const participantButtons = createInvitationButtons(
                invitation.id,
                'completed',
                isFull
              );
              const hostButtons = createHostButtons(invitation.id, 'completed');

              await starterMessage.edit({
                embeds: [embed],
                components: [participantButtons, hostButtons],
              });
            }
          }

          // Archive the thread
          await thread.setArchived(true);

          logger.info('Auto-closed invitation', {
            invitationId: invitation.id,
            eventName: invitation.eventName,
            endTime: invitation.endTime,
          });
        }
      } catch (error) {
        logger.error('Failed to auto-close invitation', {
          error: error instanceof Error ? error.message : String(error),
          invitationId: invitation.id,
        });
      }
    }

    logger.info('Auto-close batch completed', {
      processed: invitations.length,
    });
  } catch (error) {
    logger.error('Failed to fetch invitations for auto-close', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
