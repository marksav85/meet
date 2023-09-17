Feature: Specify Number of Events
  Scenario: When user hasn’t specified a number, 32 events are shown by default
    Given the app is open
    And a list of events is displayed
    When user does not specify a number of events
    Then 32 events are shown by default

  Scenario: User can change the number of events displayed.
    Given user can see a list of events
    When user enters the number 3
    Then a maximum of 3 events are shown