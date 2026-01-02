# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Sparlo" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "Sparlo" [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "Sign in to your account" [level=4] [ref=e8]
        - paragraph [ref=e9]: Welcome back! Please enter your details
      - generic [ref=e11]:
        - generic [ref=e12]:
          - group [ref=e14]:
            - group [ref=e15]:
              - img [ref=e16]
            - textbox "your@email.com" [active] [ref=e19]
          - generic [ref=e20]:
            - generic [ref=e21]:
              - img [ref=e22]
              - textbox "************" [ref=e25]
              - button "Show password" [ref=e26]:
                - img [ref=e27]
            - link "Forgot Password?" [ref=e31] [cursor=pointer]:
              - /url: /auth/password-reset
        - button "Sign in with Email" [ref=e32] [cursor=pointer]:
          - generic [ref=e33]:
            - text: Sign in with Email
            - img [ref=e34]
      - generic [ref=e39]: Or continue with
      - button "google logo Sign in with Google" [ref=e42] [cursor=pointer]:
        - img "google logo" [ref=e43]
        - generic [ref=e44]: Sign in with Google
      - link "Do not have an account yet?" [ref=e46] [cursor=pointer]:
        - /url: /auth/sign-up
  - region "Notifications alt+T"
  - alert [ref=e47]
```