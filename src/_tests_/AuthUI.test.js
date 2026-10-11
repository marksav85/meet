import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '../test-utils';
import App from '../App';
import * as api from '../api';
afterEach(() => jest.restoreAllMocks());
test('authorization failure offers explicit authorization and safely reports start failure', async () => {
  api.getEvents.mockRejectedValueOnce(new api.AuthError('AUTH_REQUIRED', 'Please authorize with Google to continue.'));
  const start = api.startAuthentication.mockRejectedValueOnce(new api.AuthError('AUTH_NETWORK', 'The authentication service could not be reached. Please try again.'));
  render(<App />);
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Authorize with Google' }));
  expect(start).toHaveBeenCalledWith({ explicit: true });
  expect(screen.getByRole('alert')).toHaveTextContent('The authentication service could not be reached');
  expect(screen.getByRole('button', { name: 'Authorize with Google' })).toBeEnabled();
});
test('unexpected errors do not expose SDK details in the UI', async () => {
  api.getEvents.mockRejectedValueOnce(new Error('private bearer/code details'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Events could not be loaded');
  expect(screen.queryByText(/private bearer/)).not.toBeInTheDocument();
});
