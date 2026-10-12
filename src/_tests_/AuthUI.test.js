import React from 'react';
import { render, screen, act } from '@testing-library/react';
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


test.each(["signed out", "expired", "rejected"])("%s session immediately clears protected cards and charts and ignores pending loads", async (reason) => {
  let notify;
  api.subscribeAuthentication.mockImplementation((listener) => {
    notify = listener;
    listener({ authenticated: true });
    return () => {};
  });
  const logout = api.signOut.mockImplementation(() => {
    notify({ authenticated: false, error: new api.AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.") });
  });
  let resolve;
  api.getEvents.mockResolvedValueOnce([{ id: "private", summary: "Protected event", location: "Berlin" }]);
  render(<App />);
  expect(await screen.findByText("Protected event")).toBeVisible();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  api.getEvents.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  act(() => window.dispatchEvent(new Event("online")));
  if (reason === "signed out") {
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));
    expect(logout).toHaveBeenCalledTimes(1);
  } else {
    act(() => notify({ authenticated: false, error: new api.AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.") }));
  }
  expect(screen.queryByText("Protected event")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Authorize with Google" })).toBeVisible();
  await act(async () => resolve([{ id: "late", summary: "Late protected event", location: "Berlin" }]));
  expect(screen.queryByText("Late protected event")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Authorize with Google" })).toBeVisible();
});
