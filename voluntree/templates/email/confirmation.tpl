{% extends "mail_templated/base.tpl" %}

{% block subject %}
OTP for email verification
{% endblock %}

{% block html %}
<table class="full-width-container" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"
       bgcolor="#eeeeee" style="width: 100%; height: 100%; padding: 30px 0 30px 0;">
  <tr>
    <td align="center" valign="top">
      <!-- / 700px container -->
      <table class="container" border="0" cellpadding="0" cellspacing="0" width="700" bgcolor="#ffffff"
             style="width: 700px;">
        <tr>
          <td align="center" valign="top">
            <!-- / Hero subheader -->
            <table class="container hero-subheader" border="0" cellpadding="0" cellspacing="0" width="620"
                   style="width: 620px;">
               <tr>
                <td class="hero-subheader__content"
                    style="font-size: 16px; line-height: 27px; color: #969696; padding: 60px 0;" align="center">
                  Thank your for your interest in joining us as a volunteer.
                  Please provide the OTP when you are asked in our page inbox.
                </td>
              </tr>
               <tr>
                  <td class="" style="font-size: 22px; padding: 12px" align="center">
                    Your One Time Password (OTP) is
                  </td>
               </tr>
              <tr>
                <td class="hero-subheader__title" style="font-size: 43px; font-weight: bold; padding: 15px 0 15px 0;"
                    align="center">
                  {{code}}
                </td>
              </tr>
            </table>
            <!-- /// Hero subheader -->


            <!-- / Divider -->
            <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding-top: 25px;"
                   align="center">
              <tr>
                <td align="center">
                  <table class="container" border="0" cellpadding="0" cellspacing="0" width="620" align="center"
                         style="border-bottom: solid 1px #eeeeee; width: 620px;">
                    <tr>
                      <td align="center">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- /// Divider -->

            <!-- / Footer -->
            <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%" align="center">
              <tr>
                <td align="center">
                  <table class="container" border="0" cellpadding="0" cellspacing="0" width="620" align="center"
                         style="border-top: 1px solid #eeeeee; width: 620px;">
                    <tr>
                      <td style="text-align: center; padding: 50px 0 10px 0;">
                        <small style="text-decoration: none; color: #d5d5d5;"><i>Powered By</i></small>
                      </td>
                    </tr>

                    <tr>
                      <td style="text-align: center; padding: 0 0 10px 0;">
                        <a href="#" style="font-size: 28px; text-decoration: none; color: #6f6f6f;">Voluntree</a>
                      </td>
                    </tr>

                    <tr>
                      <td style="color: #d5d5d5; text-align: center; font-size: 15px; padding: 10px 0 60px 0; line-height: 22px;">
                        Copyright &copy; 2020 <a href="https://voluntree.ml" target="_blank"
                                                 style="text-decoration: none; border-bottom: 1px solid #d5d5d5; color: #d5d5d5;">Voluntree</a>.
                        All rights reserved.
                        <br/>
                        <a>Terms</a> &bull; <a>Privacy Policy</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- /// Footer -->
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
{% endblock %}