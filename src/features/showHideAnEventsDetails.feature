Feature: Show/Hide an events details
  Scenario: An event element is collapsed by default.
    Given user can see a list of events
    When user does not click on the show details button
    Then the event element will be collapsed by default

  Scenario: User can expand an event to see details.
    Given user can see a list of events
    When user clicks on the show details button
    Then the event element will be expanded

  Scenario: User can collapse an event to hide details.
    Given user has already clicked on the details button
    And the event element is already expanded
    When user clicks on the hide details button
    Then the event element will collapse