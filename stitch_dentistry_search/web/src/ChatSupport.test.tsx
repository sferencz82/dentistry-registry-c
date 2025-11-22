import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatSupport } from './ChatSupport';
import { ChatResponse } from './api';

describe('ChatSupport', () => {
  test('renders conversation and sends user-entered messages', async () => {
    const apiMock = {
      sendChatMessage: jest.fn<Promise<ChatResponse>, any>(() =>
        Promise.resolve({
          messages: [{ id: 'assistant-1', author: 'assistant', text: 'Thanks for reaching out!' }]
        })
      )
    };

    render(<ChatSupport api={apiMock} sessionId="test-session" />);

    expect(screen.getByText(/AI receptionist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What are your hours/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Message text'), { target: { value: 'Hello there' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() =>
      expect(apiMock.sendChatMessage).toHaveBeenCalledWith({ sessionId: 'test-session', text: 'Hello there' })
    );

    expect(await screen.findByText(/Thanks for reaching out/i)).toBeInTheDocument();
  });

  test('handles quick replies and booking status updates', async () => {
    const apiMock = {
      sendChatMessage: jest.fn<Promise<ChatResponse>, any>()
    };

    apiMock.sendChatMessage
      .mockResolvedValueOnce({
        messages: [{ id: 'assistant-2', author: 'assistant', text: 'I can help with that booking.' }],
        bookingUpdate: { status: 'pending', details: 'Requesting appointment with Dr. Nova' }
      })
      .mockResolvedValueOnce({
        messages: [
          {
            id: 'assistant-3',
            author: 'assistant',
            text: 'Booked your cleaning for Tuesday at 10:00 AM.'
          }
        ],
        bookingUpdate: {
          status: 'confirmed',
          details: 'Appointment scheduled for Tuesday at 10:00 AM',
          confirmationNumber: 'CONF-123'
        }
      });

    render(<ChatSupport api={apiMock} sessionId="booking-session" />);

    fireEvent.click(screen.getByRole('button', { name: /Book for me/i }));

    await waitFor(() =>
      expect(apiMock.sendChatMessage).toHaveBeenCalledWith({
        sessionId: 'booking-session',
        quickReply: 'Can you book for me?'
      })
    );

    expect(await screen.findByText(/Requesting appointment with Dr. Nova/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Message text'), { target: { value: 'Tuesday at 10am works' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() =>
      expect(apiMock.sendChatMessage).toHaveBeenCalledWith({
        sessionId: 'booking-session',
        text: 'Tuesday at 10am works'
      })
    );

    expect(await screen.findByText(/Appointment scheduled for Tuesday/i)).toBeInTheDocument();
    expect(await screen.findByText(/Confirmation: CONF-123/i)).toBeInTheDocument();
    expect(await screen.findByText(/Booked your cleaning/i)).toBeInTheDocument();
  });
});
