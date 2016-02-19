Feature: Forming friendships between users

  Scenario: Setup

    Given I empty my "auth.User" table
    And I add the following rows for "auth.User":
      | id | username | email             |
      | 1  | Jason    | jason@example.com |
      | 2  | Peter    | peter@example.com |
      | 3  | James    | james@example.com |
      | 4  | Casey    | casey@example.com |
      | 5  | Annie    | annie@example.com |

  Scenario: Requesting a friendship

    Given I empty my "friendships.Friendship" table
    And I log in as "Jason"

    When I send a request for a friendship with "Peter"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | P      |

  Scenario: Accepting a friendship request

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
    And I log in as "Peter"

    When I accept a friendship request from "Jason"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | A      |

  Scenario: Rejecting a friendship request

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
    And I log in as "Peter"

    When I reject a friendship request from "Jason"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | R      |

  Scenario: Getting current friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | A      |
      | 1         | 3           | R      |
      | 1         | 4           | P      |
      | 5         | 1           | A      |
      | 2         | 3           | A      |
    And I log in as "Jason"

    When I get my current friends
    Then I get a response with the following list:
      | username | email             |
      | Peter    | peter@example.com |
      | Annie    | annie@example.com |

  Scenario: Getting pending friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
      | 3         | 1           | P      |
      | 1         | 4           | A      |
      | 1         | 5           | R      |
      | 2         | 3           | P      |
    And I log in as "Jason"

    When I get my pending friends
    Then I get a response with the following list:
      | username | email             |
      | James    | james@example.com |

  Scenario: Getting users that are not friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
      | 1         | 3           | A      |
      | 1         | 4           | R      |
    And I log in as "Jason"

    When I get users that are not friends
    Then I get a response with the following list:
      | username | email             |
      | Annie    | annie@example.com |

